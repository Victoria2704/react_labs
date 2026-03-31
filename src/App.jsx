import { useEffect, useState } from "react";
import BookCard from "./BookCard";
import fallbackBooks from "./fallbackBooks";
import "./App.css";

const BOOKS_API_URL = "https://fakeapi.extendsclass.com/books";
const GOOGLE_BOOKS_API_URL = "https://www.googleapis.com/books/v1/volumes";
const GOOGLE_IMAGE_PROXY_PREFIX = "/google-books-image";
const OPEN_LIBRARY_PROXY_PREFIX = "/open-library-cover";
const BOOKS_LIMIT = 12;
const BOOKS_API_TIMEOUT_MS = 12000;
const GOOGLE_API_TIMEOUT_MS = 12000;

function buildGoogleProxyUrl(imageUrl) {
  const url = new URL(imageUrl.replace("http://", "https://"));
  return `${GOOGLE_IMAGE_PROXY_PREFIX}${url.pathname}${url.search}`;
}

function buildOpenLibraryProxyUrl(coverId) {
  return `${OPEN_LIBRARY_PROXY_PREFIX}/b/id/${coverId}-L.jpg?default=false`;
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
  } catch (error) {
    if (timeoutSignal.aborted && !signal?.aborted) {
      throw new Error(`Request timed out after ${timeoutMs} ms`);
    }

    throw error;
  } finally {
    cleanup();
  }
}

async function getBooks(signal) {
  try {
    const response = await fetchWithTimeout(BOOKS_API_URL, {
      signal,
      timeoutMs: BOOKS_API_TIMEOUT_MS,
    });

    if (!response.ok) {
      throw new Error(`Books API returned ${response.status}`);
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error("Books API returned invalid data");
    }

    return data.slice(0, BOOKS_LIMIT);
  } catch (error) {
    console.error("Ошибка загрузки книг из API:", error);
    return fallbackBooks.slice(0, BOOKS_LIMIT);
  }
}

async function fetchImageBlob(url, signal) {
  try {
    const response = await fetchWithTimeout(url, {
      signal,
      timeoutMs: GOOGLE_API_TIMEOUT_MS,
    });

    if (!response.ok) {
      return null;
    }

    return await response.blob();
  } catch (error) {
    if (error.name !== "AbortError") {
      console.error("Ошибка загрузки изображения:", error);
    }

    return null;
  }
}

async function getBookImageBlob(book, signal) {
  const queries = [];

  if (book.isbn) {
    queries.push(`isbn:${book.isbn}`);
  }

  if (book.title) {
    const firstAuthor = Array.isArray(book.authors) ? book.authors[0] : "";
    queries.push(
      `intitle:${book.title}${firstAuthor ? ` inauthor:${firstAuthor}` : ""}`
    );
  }

  for (const query of queries) {
    try {
      const googleResponse = await fetchWithTimeout(
        `${GOOGLE_BOOKS_API_URL}?q=${encodeURIComponent(query)}&maxResults=1`,
        { signal, timeoutMs: GOOGLE_API_TIMEOUT_MS }
      );

      if (!googleResponse.ok) {
        continue;
      }

      const googleData = await googleResponse.json();
      const thumbnail =
        googleData.items?.[0]?.volumeInfo?.imageLinks?.thumbnail?.replace(
          "http://",
          "https://"
        ) ?? "";

      if (!thumbnail) {
        continue;
      }

      const imageBlob = await fetchImageBlob(buildGoogleProxyUrl(thumbnail), signal);

      if (imageBlob) {
        return imageBlob;
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("Ошибка загрузки обложки:", error);
      }
    }
  }

  if (book.openLibraryCoverId) {
    return await fetchImageBlob(
      buildOpenLibraryProxyUrl(book.openLibraryCoverId),
      signal
    );
  }

  return null;
}

function App() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;

    async function loadBooks() {
      try {
        setLoading(true);
        setErrorMessage("");

        const booksData = await getBooks(controller.signal);

        if (!isActive) {
          return;
        }

        const booksWithoutImages = booksData.map((book) => ({
          ...book,
          image: null,
          coverStatus: "loading",
        }));

        setBooks(booksWithoutImages);
        setLoading(false);

        for (const book of booksWithoutImages) {
          const image = await getBookImageBlob(book, controller.signal);

          if (!isActive) {
            return;
          }

          setBooks((currentBooks) =>
            currentBooks.map((currentBook) =>
              currentBook.id === book.id
                ? {
                    ...currentBook,
                    image,
                    coverStatus: image ? "loaded" : "missing",
                  }
                : currentBook
            )
          );
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Ошибка загрузки книг:", error);

          if (isActive) {
            setBooks([]);
            setErrorMessage("Не удалось загрузить книги из API.");
            setLoading(false);
          }
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
      {!loading && (
        <>
          {!errorMessage && books.length === 0 ? (
            <p className="app-status">Список книг пуст.</p>
          ) : null}
          {!errorMessage && books.length > 0 ? (
            <div className="books-container">
              {books.map((book) => (
                <BookCard
                  key={book.id}
                  title={book.title}
                  authors={book.authors}
                  image={book.image}
                  coverStatus={book.coverStatus}
                />
              ))}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

export default App;
