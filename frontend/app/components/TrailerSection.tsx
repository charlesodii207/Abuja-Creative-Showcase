const TRAILER_VIDEO_ID = "tntxfedFMpw";

export default function TrailerSection() {
  return (
    <section
      id="trailer"
      aria-labelledby="trailer-heading"
      style={{
        width: "100%",
        maxWidth: "960px",
        margin: "0 auto",
        padding: "64px 20px",
        boxSizing: "border-box",
      }}
    >
      <h2
        id="trailer-heading"
        style={{
          textAlign: "center",
          marginBottom: "24px",
          fontSize: "clamp(1.5rem, 4vw, 2.25rem)",
          fontWeight: 700,
        }}
      >
        Watch the Trailer
      </h2>

      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "16 / 9",
          borderRadius: "16px",
          overflow: "hidden",
          boxShadow: "0 10px 40px rgba(0, 0, 0, 0.25)",
          background: "#000",
        }}
      >
        <iframe
          src={`https://www.youtube.com/embed/${TRAILER_VIDEO_ID}?rel=0`}
          title="Afriqa Creative Showcase 2026 - Event Trailer"
          loading="lazy"
          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            border: 0,
          }}
        />
      </div>
    </section>
  );
}