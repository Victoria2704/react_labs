function BookCard({ title, authors, image }){
    return(
        <div>
            <img src={image} alt={title} />
            <h2>{title}</h2>
            <p>{authors.join(", ")}</p>
        </div>
    )
}

export default BookCard;