<?php
class Tour
{
    private $conn;
    private $json_file = '../../data/tours.json';

    public $id;
    public $guide_id;
    public $title;
    public $description;
    public $location;
    public $price;
    public $schedule_date;
    public $created_at;

    public function __construct($db)
    {
        $this->conn = $db;
        // Fix path if running from root vs api
        if (!file_exists($this->json_file) && file_exists('data/tours.json')) {
            $this->json_file = 'data/tours.json';
        }
    }

    private function getData()
    {
        if (!file_exists($this->json_file)) {
            file_put_contents($this->json_file, '[]');
            return [];
        }
        $content = file_get_contents($this->json_file);
        return json_decode($content, true) ?? [];
    }

    private function saveData($data)
    {
        file_put_contents($this->json_file, json_encode($data, JSON_PRETTY_PRINT));
    }

    // Create Tour
    public function create()
    {
        $data = $this->getData();

        // Auto ID
        $last_item = end($data);
        $this->id = $last_item ? $last_item['id'] + 1 : 1;
        $this->created_at = date('Y-m-d H:i:s');

        $new_item = [
            'id' => $this->id,
            'guide_id' => $this->guide_id,
            'title' => $this->title,
            'description' => $this->description,
            'location' => $this->location,
            'price' => $this->price,
            'schedule_date' => $this->schedule_date,
            'created_at' => $this->created_at
        ];

        $data[] = $new_item;
        $this->saveData($data);
        return true;
    }

    // Read all tours
    public function read()
    {
        return $this->getData();
    }

    // Read single tour
    public function read_single()
    {
        $data = $this->getData();
        foreach ($data as $item) {
            if ($item['id'] == $this->id) {
                $this->guide_id = $item['guide_id'];
                $this->title = $item['title'];
                $this->description = $item['description'];
                $this->location = $item['location'];
                $this->price = $item['price'];
                $this->schedule_date = $item['schedule_date'];
                return true;
            }
        }
        return false;
    }

    // Update Tour
    public function update()
    {
        $data = $this->getData();
        $found = false;

        foreach ($data as &$item) {
            if ($item['id'] == $this->id) {
                // Ensure the user owns this tour (basic check)
                if ($item['guide_id'] != $this->guide_id)
                    return false;

                $item['title'] = $this->title;
                $item['description'] = $this->description;
                $item['location'] = $this->location;
                $item['price'] = $this->price;
                $item['schedule_date'] = $this->schedule_date;
                $found = true;
                break;
            }
        }

        if ($found) {
            $this->saveData($data);
            return true;
        }
        return false;
    }

    // Delete Tour
    public function delete()
    {
        $data = $this->getData();
        $new_data = [];
        $found = false;

        foreach ($data as $item) {
            if ($item['id'] == $this->id) {
                if ($item['guide_id'] != $this->guide_id)
                    return false;
                $found = true;
                continue;
            }
            $new_data[] = $item;
        }

        if ($found) {
            $this->saveData($new_data);
            return true;
        }
        return false;
    }
}
