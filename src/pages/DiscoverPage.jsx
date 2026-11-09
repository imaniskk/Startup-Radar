import { useOutletContext } from "react-router-dom";
import { useState, useEffect } from "react";
import previewStartups from "../data/startups_seed.json";
import "./DiscoverPage.css";

export default function DiscoverPage() {
  const [apiStartups, setApiStartups] = useState([]);
  const [usePreview, setUsePreview] = useState(false);
  const startups = usePreview ? previewStartups : apiStartups;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const {
    search,
    setSearch,
    selectedIndustry,
    setSelectedIndustry,
    selectedLocation,
    setSelectedLocation,
    selectedStage,
    setSelectedStage,
    savedStartups,
    setSavedStartups,
    showSaved,
    setShowSaved,
  } = useOutletContext();

  // Get startup data from the Python backend and Supabase
  useEffect(() => {
    const controller = new AbortController();

    async function fetchStartups() {
      try {
        const response = await fetch("http://127.0.0.1:8000/startups", {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Failed to fetch startups");
        }

        const data = await response.json();
        if (!Array.isArray(data)) {
          throw new Error("Expected a list of startups");
        }
        setApiStartups(data.map((startup) => ({
          ...startup,
          id: startup.startup_id ?? startup.id,
          funding_round: startup.funding_round ?? startup.seed_round ?? null,
        })));
      } catch (err) {
        if (controller.signal.aborted) return;
        console.error("Error loading startups:", err);
        setError("Unable to load startups. Check that the backend is running.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    fetchStartups();
    return () => controller.abort();
  }, []);

  // Apply all filters together
  const filteredStartups = startups.filter((startup) => {
    const matchesSearch = (startup.name ?? "")
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesIndustry =
      selectedIndustry === "All" ||
      startup.industry === selectedIndustry;

    const matchesLocation =
      selectedLocation === "All" ||
      startup.location === selectedLocation;

    const matchesStage =
      selectedStage === "All" ||
      (startup.funding_round ?? "Not verified") === selectedStage;

    const matchesSaved =
      !showSaved || savedStartups.includes(startup.id);

    return (
      matchesSearch &&
      matchesIndustry &&
      matchesLocation &&
      matchesStage &&
      matchesSaved
    );
  });

  // Save or unsave a startup
  const toggleSave = (id) => {
    setSavedStartups((previous) =>
      previous.includes(id)
        ? previous.filter((savedId) => savedId !== id)
        : [...previous, id]
    );
  };

  // Build filter options from real startup data
  const industries = [...new Set(startups.map((s) => s.industry).filter(Boolean))];
  const locations = [...new Set(startups.map((s) => s.location).filter(Boolean))];
  const stages = [...new Set(startups.map((s) => s.funding_round ?? "Not verified").filter(Boolean))];

  return (
    <main className="discover-page">
      <header className="discover-header">
        <h1 className="discover-title">
          Discover Startups ♡
        </h1>
        <p className="discover-subtitle">
          Find startups that match your interests!
        </p>
      </header>

      <div className="search-panel">
        <label>
          <input
            type="checkbox"
            checked={usePreview}
            onChange={(event) => {
              setUsePreview(event.target.checked);
              setSelectedIndustry("All");
              setSelectedLocation("All");
              setSelectedStage("All");
            }}
          />{" "}
          Use local YC preview data (no backend required)
        </label>
        <p className="discover-subtitle">
          {usePreview
            ? "Preview: 50 real YC startups retrieved November 9, 2026. Funding is unverified."
            : "Showing startup data from the team backend."}
        </p>
      </div>

      {/* Search and filter section */}
      <div className="search-panel">
        <h2 className="search-panel-title">
          Find Your Perfect Match
        </h2>

        <input
          type="text"
          placeholder="Search startups by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="startup-search"
        />

        <div className="startup-filters">
          <div>
            <label htmlFor="industry">Industry</label>
            <select
              id="industry"
              className="startup-filter"
              value={selectedIndustry}
              onChange={(e) => setSelectedIndustry(e.target.value)}
            >
              <option value="All">All Industries</option>
              {industries.map((industry) => (
                <option key={industry} value={industry}>
                  {industry}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="location">Location</label>
            <select
              id="location"
              className="startup-filter"
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
            >
              <option value="All">All Locations</option>
              {locations.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="stage">Funding Stage</label>
            <select
              id="stage"
              className="startup-filter"
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
            >
              <option value="All">All Stages</option>
              {stages.map((stage) => (
                <option key={stage} value={stage}>
                  {stage}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Startup results */}
      <div className="results-toolbar">
        <h2 className="results-title">
          {showSaved ? "Saved Startups" : "Explore Startups"} (
          {filteredStartups.length})
        </h2>

        <button
          onClick={() => setShowSaved(!showSaved)}
          className="saved-toggle"
        >
          {showSaved ? "View All Startups" : "♡ View Saved"}
        </button>
      </div>

      {!usePreview && loading && (
        <div className="empty-results">
          Loading startups...
        </div>
      )}

      {!usePreview && error && (
        <div className="empty-results">
          {error}
        </div>
      )}

      {(usePreview || (!loading && !error)) && (
        <>
          <div className="startup-grid">
            {filteredStartups.map((startup) => {
              const isSaved = savedStartups.includes(startup.id);

              return (
                <div
                  key={startup.id}
                  className="startup-card"
                >
                  <div className="startup-card-header">
                    <h2 className="startup-name">
                      {startup.name}
                    </h2>
                    <span className="startup-flower">🌸</span>
                  </div>

                  <p className="startup-description">
                    {startup.description}
                  </p>

                  <span className="startup-industry">
                    {startup.industry}
                  </span>

                  <p>📍 {startup.location}</p>
                  <p>🚀 Funding Stage: {startup.funding_round ?? "Not verified"}</p>

                  <div className="startup-card-actions">
                    <button
                      type="button"
                      onClick={() => toggleSave(startup.id)}
                      className={`save-startup${isSaved ? " is-saved" : ""}`}
                      aria-pressed={isSaved}
                    >
                      {isSaved ? "♥ Saved!" : "♡ Save Startup"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredStartups.length === 0 && (
            <div className="empty-results">
              {startups.length === 0
                ? "No startups are available yet."
                : "No startups match your search or filters."}
            </div>
          )}
        </>
      )}

      <p className="discover-footer">
        Made with ♡ | Startup Discovery
      </p>
    </main>
  );
}

