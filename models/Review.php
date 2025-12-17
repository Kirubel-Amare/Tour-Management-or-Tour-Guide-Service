<?php
class Review
{
    private $conn;
    private $table_name = 'tour_reviews';

    public $id;
    public $tour_id;
    public $user_id;
    public $rating;
    public $comment;
    public $created_at;

    public function __construct($db)
    {
        $this->conn = $db;
    }

    public function create()
    {
        $query = "INSERT INTO " . $this->table_name . "
                  SET tour_id = :tour_id,
                      user_id = :user_id,
                      rating = :rating,
                      comment = :comment";

        $stmt = $this->conn->prepare($query);

        $this->tour_id = htmlspecialchars(strip_tags($this->tour_id));
        $this->user_id = htmlspecialchars(strip_tags($this->user_id));
        $this->rating = htmlspecialchars(strip_tags($this->rating));
        $this->comment = htmlspecialchars(strip_tags($this->comment));

        $stmt->bindParam(':tour_id', $this->tour_id);
        $stmt->bindParam(':user_id', $this->user_id);
        $stmt->bindParam(':rating', $this->rating);
        $stmt->bindParam(':comment', $this->comment);

        if ($stmt->execute()) {
            return true;
        }

        printf("Error: %s.\n", $stmt->errorInfo()[2]);
        return false;
    }

    public function readByTour()
    {
        $query = "SELECT r.id, r.tour_id, r.user_id, r.rating, r.comment, r.created_at,
                         u.name as reviewer_name
                  FROM " . $this->table_name . " r
                  JOIN users u ON r.user_id = u.id
                  WHERE r.tour_id = :tour_id
                  ORDER BY r.created_at DESC";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':tour_id', $this->tour_id);
        $stmt->execute();

        return $stmt;
    }

    public function readByGuide($guide_id)
    {
        $query = "SELECT r.id, r.tour_id, r.user_id, r.rating, r.comment, r.created_at,
                         t.title as tour_title, u.name as reviewer_name
                  FROM " . $this->table_name . " r
                  JOIN tours t ON r.tour_id = t.id
                  JOIN users u ON r.user_id = u.id
                  WHERE t.guide_id = :guide_id
                  ORDER BY r.created_at DESC";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':guide_id', $guide_id);
        $stmt->execute();

        return $stmt;
    }

    public function statsByGuide($guide_id)
    {
        $query = "SELECT AVG(r.rating) as avg_rating, COUNT(*) as total_reviews
                  FROM " . $this->table_name . " r
                  JOIN tours t ON r.tour_id = t.id
                  WHERE t.guide_id = :guide_id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':guide_id', $guide_id);
        $stmt->execute();

        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
}
