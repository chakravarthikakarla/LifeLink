import Navbar from "../components/Navbar";

const MainLayout = ({ children }) => {
  return (
    <>
      <Navbar />
      <div className="pt-24">
        {children}
      </div>
    </>
  );
};

export default MainLayout;
