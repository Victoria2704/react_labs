import { useEffect, useMemo } from "react";

function BookCard({ title, authors, image, coverStatus }) {
  const imageSrc = useMemo(() => {
    if (!image) return "";

    return URL.createObjectURL(image);
  }, [image]);

  useEffect(() => {
    if (!image || !imageSrc.startsWith("blob:")) {
      return undefined;
    }

    return () => {
      URL.revokeObjectURL(imageSrc);
    };
  }, [image, imageSrc]);

  const authorsText =
    Array.isArray(authors) && authors.length > 0
      ? authors.join(", ")
      : "Автор не указан";

  return (
    <article className="book-card">
      {imageSrc ? (
        <img src={imageSrc} alt={`Обложка книги «${title}»`} className="book-image" />
      ) : (
        <div className="book-image book-image-placeholder">
          {coverStatus === "loading" ? "Загрузка обложки..." : "Нет обложки"}
        </div>
      )}

      <h2 className="book-title">{title}</h2>
      <p className="book-authors">{authorsText}</p>
    </article>
  );
}

export default BookCard;
