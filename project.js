

const cityInput = document.getElementById("city");
const searchBtn = document.getElementById("search");
const statusEl = document.getElementById("status");

const cityNameEl = document.getElementById("cityName");
const temperatureEl = document.getElementById("temperature");
const conditionEl = document.getElementById("condition");
const iconEl = document.getElementById("icon");
const humidityEl = document.getElementById("humidity");
const windEl = document.getElementById("wind");
const pressureEl = document.getElementById("pressure");

// Maps Open-Meteo "weather codes" to a label + emoji icon
const weatherCodeMap = {
    0: ["Clear Sky", "☀️"],
    1: ["Mainly Clear", "🌤️"],
    2: ["Partly Cloudy", "⛅"],
    3: ["Overcast", "☁️"],
    45: ["Fog", "🌫️"],
    48: ["Depositing Rime Fog", "🌫️"],
    51: ["Light Drizzle", "🌦️"],
    53: ["Drizzle", "🌦️"],
    55: ["Dense Drizzle", "🌧️"],
    61: ["Slight Rain", "🌦️"],
    63: ["Rain", "🌧️"],
    65: ["Heavy Rain", "🌧️"],
    71: ["Slight Snow", "🌨️"],
    73: ["Snow", "🌨️"],
    75: ["Heavy Snow", "❄️"],
    80: ["Rain Showers", "🌦️"],
    81: ["Rain Showers", "🌧️"],
    82: ["Violent Rain Showers", "⛈️"],
    95: ["Thunderstorm", "⛈️"],
    96: ["Thunderstorm w/ Hail", "⛈️"],
    99: ["Thunderstorm w/ Hail", "⛈️"]
};

function setStatus(message, isError = false) {
    statusEl.innerHTML = message
        ? `<span class="${isError ? "text-danger" : "text-muted"}">${message}</span>`
        : "";
}

function setLoading(isLoading) {
    searchBtn.disabled = isLoading;
    searchBtn.innerHTML = isLoading
        ? `<span class="spinner-border spinner-border-sm"></span>`
        : "Search";
}

async function getCoordinates(city) {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Could not reach the geocoding service.");
    const data = await res.json();

    if (!data.results || data.results.length === 0) {
        throw new Error(`City "${city}" not found. Try a different spelling.`);
    }

    const { latitude, longitude, name, country } = data.results[0];
    return { latitude, longitude, label: country ? `${name}, ${country}` : name };
}

async function getWeather(latitude, longitude) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,surface_pressure`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Could not reach the weather service.");
    const data = await res.json();

    if (!data.current) throw new Error("Weather data unavailable for this location.");
    return data.current;
}

function renderWeather(cityLabel, current) {
    const code = current.weather_code;
    const [label, icon] = weatherCodeMap[code] || ["Unknown", "❓"];

    cityNameEl.textContent = cityLabel;
    temperatureEl.textContent = `${Math.round(current.temperature_2m)}°C`;
    conditionEl.textContent = label;
    iconEl.textContent = icon;
    humidityEl.textContent = `${Math.round(current.relative_humidity_2m)}%`;
    windEl.textContent = `${Math.round(current.wind_speed_10m)} km/h`;
    pressureEl.textContent = `${Math.round(current.surface_pressure)} hPa`;
}

async function handleSearch() {
    const city = cityInput.value.trim();

    if (!city) {
        setStatus("Please enter a city name.", true);
        return;
    }

    setLoading(true);
    setStatus("Fetching weather...");

    try {
        const { latitude, longitude, label } = await getCoordinates(city);
        const current = await getWeather(latitude, longitude);
        renderWeather(label, current);
        setStatus("");
    } catch (err) {
        setStatus(err.message || "Something went wrong. Please try again.", true);
    } finally {
        setLoading(false);
    }
}

searchBtn.addEventListener("click", handleSearch);

cityInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        e.preventDefault();
        handleSearch();
    }
});


window.addEventListener("DOMContentLoaded", () => {
    cityInput.value = "London";
    handleSearch();
});