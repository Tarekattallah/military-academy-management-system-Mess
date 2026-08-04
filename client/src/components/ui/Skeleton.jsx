

export function Skeleton({ className = '', ...rest }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-secondary ${className}`}
      {...rest} />);


}