import { useEffect, useState } from "react";
import BookCard from "./BookCard";
import fallbackBooks from "./fallbackBooks";
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

function escapeXml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function createPlaceholderCoverBlob(title, authors) {
  const safeTitle = escapeXml(title || "Book");
  const safeAuthors = escapeXml(
    Array.isArray(authors) && authors.length > 0 ? authors.join(", ") : "Unknown author"
  );

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="360" height="520" viewBox="0 0 360 520">
      <defs>
        <linearGradient id="coverGradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#0f172a" />
          <stop offset="100%" stop-color="#1d4ed8" />
        </linearGradient>
      </defs>
      <rect width="360" height="520" rx="24" fill="url(#coverGradient)" />
      <rect x="28" y="28" width="304" height="464" rx="18" fill="rgba(255,255,255,0.08)" />
      <text x="40" y="110" fill="#bfdbfe" font-family="Arial, sans-serif" font-size="18">
        Book App
      </text>
      <foreignObject x="40" y="145" width="280" height="200">
        <div xmlns="http://www.w3.org/1999/xhtml"
          style="font-family: Arial, sans-serif; font-size: 34px; line-height: 1.2; color: white; font-weight: 700;">
          ${safeTitle}
        </div>
      </foreignObject>
      <foreignObject x="40" y="370" width="280" height="90">
        <div xmlns="http://www.w3.org/1999/xhtml"
          style="font-family: Arial, sans-serif; font-size: 20px; line-height: 1.35; color: #dbeafe;">
          ${safeAuthors}
        </div>
      </foreignObject>
    </svg>
  `;

  return new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
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

function buildBaseBooks(data) {
  const sourceBooks =
    Array.isArray(data) && data.length > 0 ? data.slice(0, BOOKS_LIMIT) : fallbackBooks;

  return sourceBooks.map((book) => ({
    ...book,
    imageBlob: createPlaceholderCoverBlob(book.title, book.authors),
    imageUrl: "",
  }));
}

async function getBookCoverData(book, signal) {
  const { isbn, title, authors } = book;
  const placeholderBlob = createPlaceholderCoverBlob(title, authors);

  if (!isbn) {
    return { imageBlob: placeholderBlob, imageUrl: "" };
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
      return { imageBlob: placeholderBlob, imageUrl: "" };
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
        imageBlob: placeholderBlob,
        imageUrl: thumbnail,
      };
    }
  } catch (error) {
    if (error.name !== "AbortError") {
      console.error("Ошибка загрузки обложки:", error);
    }

    return { imageBlob: placeholderBlob, imageUrl: "" };
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
        const baseBooks = buildBaseBooks(data);

        if (isActive) {
          setBooks(baseBooks);
          setLoading(false);
          hasLoadedBaseBooks = true;
        }

        for (const book of baseBooks) {
          const coverData = await getBookCoverData(book, controller.signal);

          if (!isActive) {
            return;
          }

          setBooks((currentBooks) =>
            currentBooks.map((currentBook) =>
              currentBook.id === book.id ? { ...currentBook, ...coverData } : currentBook
            )
          );
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Ошибка загрузки книг:", error);

          if (isActive) {
            const baseBooks = buildBaseBooks([]);
            setBooks(baseBooks);
            setLoading(false);
            hasLoadedBaseBooks = true;

            for (const book of baseBooks) {
              const coverData = await getBookCoverData(book, controller.signal);

              if (!isActive) {
                return;
              }

              setBooks((currentBooks) =>
                currentBooks.map((currentBook) =>
                  currentBook.id === book.id ? { ...currentBook, ...coverData } : currentBook
                )
              );
            }

            setErrorMessage("");
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
