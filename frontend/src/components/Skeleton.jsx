const Skeleton = ({ className, height = "1rem", width = "100%", borderRadius = "0.5rem" }) => {
  return (
    <div
      className={`bg-gray-200 animate-pulse ${className}`}
      style={{
        height,
        width,
        borderRadius,
      }}
    />
  );
};

export default Skeleton;
