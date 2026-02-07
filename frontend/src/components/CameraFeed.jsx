export default function CameraFeed({ videoRef }) {
  return (
    <div className="absolute inset-0 z-0 bg-black">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
        style={{
          willChange: "transform",
          transform: "scaleX(-1)",
        }}
      />
    </div>
  );
}
