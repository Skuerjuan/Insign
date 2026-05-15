export default function Input({
  placeholder, 
  type,
  icon,
  eyeIcon
}) {
  return (
    <div className="containerIni">
     <img
        src={icon}
        className="icon"
      />
     <input
        type={type}
        placeholder={placeholder}
        className="input"
      />
     {eyeIcon && (
        <img
          src={eyeIcon}
          className="icon"
        />
      )}
    </div>
  );
}