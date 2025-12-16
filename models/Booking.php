<?php
class Booking
{
    private $conn;
    private $json_file = '../../data/bookings.json';

    public $id;
    public $tour_id;
    public $tourist_id;
    public $status;
    public $created_at;

    public function __construct($db)
    {
        $this->conn = $db;
        // Fix path if running from root vs api
        if (!file_exists($this->json_file) && file_exists('data/bookings.json')) {
            $this->json_file = 'data/bookings.json';
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

    // Create Booking
    public function create()
    {
        $data = $this->getData();

        $last_item = end($data);
        $this->id = $last_item ? $last_item['id'] + 1 : 1;
        $this->created_at = date('Y-m-d H:i:s');

        $new_item = [
            'id' => $this->id,
            'tour_id' => $this->tour_id,
            'tourist_id' => $this->tourist_id,
            'status' => 'confirmed', // Default to confirmed for demo
            'created_at' => $this->created_at
        ];

        $data[] = $new_item;
        $this->saveData($data);
        return true;
    }

    // Read Bookings by Tourist
    public function read_by_tourist()
    {
        $data = $this->getData();
        $my_bookings = [];
        foreach ($data as $item) {
            if ($item['tourist_id'] == $this->tourist_id) {
                // Here we would ideally join with Tours to get tour details
                // For JSON, we do it in the API layer or frontend, 
                // but let's just return the booking data for now.
                $my_bookings[] = $item;
            }
        }
        return $my_bookings;
    }

    // Read Bookings by Tour (For Guides)
    public function read_by_tour($tour_id)
    {
        $data = $this->getData();
        $tour_bookings = [];
        foreach ($data as $item) {
            if ($item['tour_id'] == $tour_id) {
                $tour_bookings[] = $item;
            }
        }
        return $tour_bookings;
    }
}
