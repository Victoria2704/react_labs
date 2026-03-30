import { useEffect, useState } from "react";
import BookCard from "./BookCard";
import "./App.css";

const BOOKS_API_URL = "https://fakeapi.extendsclass.com/books";
const GOOGLE_BOOKS_API_URL = "https://www.googleapis.com/books/v1/volumes";
const GOOGLE_IMAGE_PROXY_PREFIX = "/google-books-image";
const BOOKS_LIMIT = 12;
const BOOKS_API_TIMEOUT_MS = 12000;
const GOOGLE_API_TIMEOUT_MS = 8000;

function buildGoogleProxyUrl(imageUrl) {
  const url = new URL(imageUrl.replace("http://", "https://"));
  return `${GOOGLE_IMAGE_PROXY_PREFIX}${url.pathname}${url.search}`;
}

function createTimeoutSignal(timeoutMs, parentSignal) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const abortFromParent = () => controller.abort();

  if (parentSignal) {
    if (parentSignal.aborted) {
      controller.abort();
    } else {
      parentSignal.addEventListener("abort", abortFromParent, { once: true });
    }
  }

  return {
    signal: controller.signal,
    cleanup: () => {
      clearTimeout(timeoutId);
      parentSignal?.removeEventListener("abort", abortFromParent);
    },
  };
}

async function fetchWithTimeout(url, { signal, timeoutMs }) {
  const { signal: timeoutSignal, cleanup } = createTimeoutSignal(timeoutMs, signal);

  try {
    return await fetch(url, { signal: timeoutSignal });
  } finally {
    cleanup();
  }
}

async function getBookCoverData(isbn, signal) {
  if (!isbn) {
    return { imageBlob: null, imageUrl: "" };
  }

  try {
    const googleResponse = await fetchWithTimeout(
      `${GOOGLE_BOOKS_API_URL}?q=isbn:${encodeURIComponent(isbn)}`,
      { signal, timeoutMs: GOOGLE_API_TIMEOUT_MS }
    );

    if (!googleResponse.ok) {
      throw new Error(`Google Books API returned ${googleResponse.status}`);
    }

    const googleData = await googleResponse.json();
    const thumbnail =
      googleData.items?.[0]?.volumeInfo?.imageLinks?.thumbnail?.replace(
        "http://",
        "https://"
      ) ?? "";

    if (!thumbnail) {
      return { imageBlob: null, imageUrl: "" };
    }

    try {
      const imageResponse = await fetchWithTimeout(buildGoogleProxyUrl(thumbnail), {
        signal,
        timeoutMs: GOOGLE_API_TIMEOUT_MS,
      });

      if (!imageResponse.ok) {
        throw new Error(`Image proxy returned ${imageResponse.status}`);
      }

      return {
        imageBlob: await imageResponse.blob(),
        imageUrl: thumbnail,
      };
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("Не удалось получить BLOB обложки, используется прямая ссылка:", error);
      }

      return {
        imageBlob: null,
        imageUrl: thumbnail,
      };
    }
  } catch (error) {
    if (error.name !== "AbortError") {
      console.error("Ошибка загрузки обложки:", error);
    }

    return { imageBlob: null, imageUrl: "" };
  }
}

function App() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;
    let hasLoadedBaseBooks = false;

    async function loadBooks() {
      try {
        setLoading(true);
        setErrorMessage("");

        const response = await fetchWithTimeout(BOOKS_API_URL, {
          signal: controller.signal,
          timeoutMs: BOOKS_API_TIMEOUT_MS,
        });

        if (!response.ok) {
          throw new Error(`Books API returned ${response.status}`);
        }

        const data = await response.json();
        const normalizedBooks = Array.isArray(data) ? data.slice(0, BOOKS_LIMIT) : [];
        const baseBooks = normalizedBooks.map((book) => ({
          ...book,
          imageBlob: null,
          imageUrl: "",
        }));

        if (isActive) {
          setBooks(baseBooks);
          setLoading(false);
          hasLoadedBaseBooks = true;
        }

        await Promise.all(
          baseBooks.map(async (book) => {
            const coverData = await getBookCoverData(book.isbn, controller.signal);

            if (!isActive) {
              return;
            }

            setBooks((currentBooks) =>
              currentBooks.map((currentBook) =>
                currentBook.id === book.id
                  ? { ...currentBook, ...coverData }
                  : currentBook
              )
            );
          })
        );
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Ошибка загрузки книг:", error);

          if (isActive) {
            setErrorMessage(
              "Не удалось загрузить книги. Проверь подключение к интернету и попробуй снова."
            );
          }
        }
      } finally {
        if (isActive && !hasLoadedBaseBooks) {
          setLoading(false);
        }
      }
    }

    loadBooks();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, []);

  return (
    <div className="app">
      <h1>Список книг</h1>

      {loading && <p className="app-status">Загрузка книг...</p>}
      {!loading && errorMessage && (
        <p className="app-status app-status-error">{errorMessage}</p>
      )}
      {!loading && !errorMessage && (
        <>
          {books.length === 0 ? (
            <p className="app-status">Список книг пуст.</p>
          ) : (
            <div className="books-container">
              {books.map((book) => (
                <BookCard
                  key={book.id}
                  title={book.title}
                  authors={book.authors}
                  imageBlob={book.imageBlob}
                  imageUrl={book.imageUrl}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default App;
