export default function CameraFeed({ videoRef, isFrontFacing }) {
  return (
    <div className="absolute inset-0 z-0 bg-black">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
        style={isFrontFacing ? { transform: "scaleX(-1)" } : undefined}
      />
    </div>
  );
}
