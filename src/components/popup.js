import { useRef, useState, useEffect } from "preact/hooks";

export function Popup({ button, children }) {
  const [showPopup, setShowPopup] = useState(false);
  const popupRef = useRef();
  button = button || <svg
    class="fill-current h-3 w-3"
    viewBox="0 0 20 20"
    xmlns="http://www.w3.org/2000/svg"
  >
    <title>Menu</title>
    <path d="M0 3h20v2H0V3zm0 6h20v2H0V9zm0 6h20v2H0v-2z" />
  </svg>;

  useEffect(() => {
    document.addEventListener("click", onBackgroundClick);
    return () => {
      document.removeEventListener("click", onBackgroundClick);
    };
  }, [popupRef.current, setShowPopup]);
  function onBackgroundClick(e) {
    if (popupRef.current && !popupRef.current.contains(e.target) && showPopup) {
      setShowPopup(false);
    }
  }
  return <span>
    <button
      class="inline-block text-teal-200 border-teal-400 hover:text-white hover:border-white ml-1"
      onClick={() => setShowPopup(!showPopup)}
    >
      {button}
    </button>
    {showPopup ? (
      <div
        class="z-10 p-1 absolute right-12 top-8 w-64 bg-white rounded-lg shadow-xl"
        ref={popupRef}
      >
        <button
          onClick={() => setShowPopup(false)}
          class="float-right text-gray-500 hover:text-black cursor-pointer mr-2"
        >
          ×
        </button>
        <div class="p-4">{children}</div>
      </div>
    ) : null}
  </span>;
}
