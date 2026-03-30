import { useEffect, useMemo } from "react";

function BookCard({ title, authors, imageBlob, imageUrl }) {
  const imageSrc = useMemo(() => {
    if (!imageBlob) {
      return imageUrl || "";
    }

    return URL.createObjectURL(imageBlob);
  }, [imageBlob, imageUrl]);

  useEffect(() => {
    if (!imageBlob || !imageSrc.startsWith("blob:")) {
      return undefined;
    }

    return () => {
      URL.revokeObjectURL(imageSrc);
    };
  }, [imageBlob, imageSrc]);

  const authorsText =
    Array.isArray(authors) && authors.length > 0
      ? authors.join(", ")
      : "Автор не указан";

  return (
    <article className="book-card">
      {imageSrc ? (
        <img src={imageSrc} alt={`Обложка книги «${title}»`} className="book-image" />
      ) : (
        <div className="book-image book-image-placeholder">Нет обложки</div>
      )}

      <h2 className="book-title">{title}</h2>
      <p className="book-authors">{authorsText}</p>
    </article>
  );
}

export default BookCard;
