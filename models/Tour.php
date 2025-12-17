<?php
class Tour
{
    private $conn;
    private $table_name = 'tours';

    public $id;
    public $guide_id;
    public $title;
    public $description;
    public $image;
    public $location;
    public $price;
    public $schedule_date;
    public $created_at;

    public function __construct($db)
    {
        $this->conn = $db;
    }

    // Create Tour
    public function create()
    {
        $query = "INSERT INTO " . $this->table_name . " 
                  SET guide_id = :guide_id, 
                      title = :title, 
                      description = :description, 
                      image = :image,
                      location = :location, 
                      price = :price, 
                      schedule_date = :schedule_date";

        $stmt = $this->conn->prepare($query);

        // Sanitize
        $this->title = htmlspecialchars(strip_tags($this->title));
        $this->description = htmlspecialchars(strip_tags($this->description));
        $this->location = htmlspecialchars(strip_tags($this->location));
        $this->price = htmlspecialchars(strip_tags($this->price));
        $this->schedule_date = htmlspecialchars(strip_tags($this->schedule_date));
        $this->image = htmlspecialchars(strip_tags($this->image));

        // Bind data
        $stmt->bindParam(':guide_id', $this->guide_id);
        $stmt->bindParam(':title', $this->title);
        $stmt->bindParam(':description', $this->description);
        $stmt->bindParam(':image', $this->image);
        $stmt->bindParam(':location', $this->location);
        $stmt->bindParam(':price', $this->price);
        $stmt->bindParam(':schedule_date', $this->schedule_date);

        if ($stmt->execute()) {
            return true;
        }

        // Print error if something goes wrong
        printf("Error: %s.\n", $stmt->errorInfo()[2]);
        return false;
    }

    // Read tours (can be for a specific guide if guide_id is set, or all active)
    public function read()
    {
        // Select query
        $query = "SELECT 
                    t.id, t.guide_id, t.title, t.description, t.image, t.location, t.price, t.schedule_date, t.created_at,
                    u.name as guide_name
                  FROM " . $this->table_name . " t
                  LEFT JOIN users u ON t.guide_id = u.id";

        // If guide_id is set, filter by it (for Manager Dashboard 'My Tours')
        if (!empty($this->guide_id)) {
            $query .= " WHERE t.guide_id = :guide_id";
        }

        $query .= " ORDER BY t.created_at DESC";

        $stmt = $this->conn->prepare($query);

        if (!empty($this->guide_id)) {
            $stmt->bindParam(':guide_id', $this->guide_id);
        }

        $stmt->execute();
        return $stmt;
    }

    // Read single tour
    public function read_single()
    {
        $query = "SELECT 
                    t.id, t.guide_id, t.title, t.description, t.image, t.location, t.price, t.schedule_date, t.created_at,
                    u.name as guide_name
                  FROM " . $this->table_name . " t
                  LEFT JOIN users u ON t.guide_id = u.id
                  WHERE t.id = ?
                  LIMIT 0,1";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->id);
        $stmt->execute();

        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($row) {
            $this->guide_id = $row['guide_id'];
            $this->title = $row['title'];
            $this->description = $row['description'];
            $this->image = $row['image'];
            $this->location = $row['location'];
            $this->price = $row['price'];
            $this->schedule_date = $row['schedule_date'];
            $this->created_at = $row['created_at'];
            return true; // Found
        }
        return false; // Not found
    }

    // Update Tour
    public function update()
    {
        $query = "UPDATE " . $this->table_name . "
                  SET title = :title, 
                      description = :description, 
                      image = :image,
                      location = :location, 
                      price = :price, 
                      schedule_date = :schedule_date
                  WHERE id = :id AND guide_id = :guide_id"; // Security check: Ensure only owner can update

        $stmt = $this->conn->prepare($query);

        // Sanitize
        $this->title = htmlspecialchars(strip_tags($this->title));
        $this->description = htmlspecialchars(strip_tags($this->description));
        $this->location = htmlspecialchars(strip_tags($this->location));
        $this->price = htmlspecialchars(strip_tags($this->price));
        $this->schedule_date = htmlspecialchars(strip_tags($this->schedule_date));
        $this->image = htmlspecialchars(strip_tags($this->image));

        // Bind data
        $stmt->bindParam(':title', $this->title);
        $stmt->bindParam(':description', $this->description);
        $stmt->bindParam(':image', $this->image);
        $stmt->bindParam(':location', $this->location);
        $stmt->bindParam(':price', $this->price);
        $stmt->bindParam(':schedule_date', $this->schedule_date);
        $stmt->bindParam(':id', $this->id);
        $stmt->bindParam(':guide_id', $this->guide_id);

        if ($stmt->execute()) {
            if ($stmt->rowCount() > 0) {
                return true;
            } else {
                // No rows affected, meaning either no change or ID/guide_id mismatch
                // We can check if the ID exists but guide_id is different to differentiate
                return false;
            }
        }
        printf("Error: %s.\n", $stmt->errorInfo()[2]);
        return false;
    }

    // Delete Tour
    public function delete()
    {
        $query = "DELETE FROM " . $this->table_name . " WHERE id = :id AND guide_id = :guide_id";

        $stmt = $this->conn->prepare($query);

        $stmt->bindParam(':id', $this->id);
        $stmt->bindParam(':guide_id', $this->guide_id);

        if ($stmt->execute()) {
            if ($stmt->rowCount() > 0) {
                return true;
            }
            return false;
        }

        printf("Error: %s.\n", $stmt->errorInfo()[2]);
        return false;
    }
}
