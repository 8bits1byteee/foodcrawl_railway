<?php
$address = "Iloilo City, Philippines";
$key = "AIzaSyBo_ih3hBVu_CO_EeC6ZFW8eozUmax_S6I";
$url = "https://maps.googleapis.com/maps/api/geocode/json?address=" . urlencode($address) . "&key=" . $key;

$response = file_get_contents($url);
$data = json_decode($response, true);

if (isset($data['results'][0]['geometry']['location'])) {
    $lat = $data['results'][0]['geometry']['location']['lat'];
    $lng = $data['results'][0]['geometry']['location']['lng'];
    echo "Latitude: $lat<br>Longitude: $lng";
} else {
    echo "<b>Error:</b> No results found or invalid API response.<br>";
    echo "<pre>";
    print_r($data);
    echo "</pre>";
}
?>