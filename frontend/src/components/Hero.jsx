

import { useNavigate } from "react-router-dom";
import heroImage from "../assets/blood.png";


const Hero = () => {
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem("token");

  const handleGetBlood = () => {
    if (!isLoggedIn) {
      navigate("/login");
    } else {
      navigate("/my-requests");
    }
  };




  return (
    <section
      className="
        pt-5
    h-[calc(100vh-96px)]
    flex flex-col md:flex-row
    items-center
    px-10 md:px-20
      "
    >
      {/* LEFT - IMAGE */}
      <div className="flex-1 flex justify-start mb-12 md:mb-0">
        <img
          src={heroImage}
          alt="Blood Donation"
          className="w-[300px] md:w-[500px] lg:w-[600px] object-contain"
        />
      </div>

      {/* RIGHT - CONTENT */}
      <div className="max-w-lg ml-auto text-center md:text-left">
        <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4">
          Save Life <br />
          Donate <span className="text-[#6a0026]">Blood</span>
        </h1>

        <p className="text-gray-600 max-w-md leading-relaxed mb-6">
          Life Link connects verified donors to provide blood quickly
          during emergencies, reducing response time and saving lives.
        </p>

        <button
          onClick={handleGetBlood}
          className="bg-black text-white px-8 py-4 rounded-xl hover:opacity-90 transition font-semibold"
        >
          Get Blood Now
        </button>

      </div>
    </section>
  );
};
export default Hero;