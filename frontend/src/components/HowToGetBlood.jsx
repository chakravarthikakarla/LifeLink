import step1 from "../assets/no-1.png";
import step2 from "../assets/no-2.png";
import step3 from "../assets/no-3.png";
import heartLine from "../assets/heart-line.png";

const HowToGetBlood = () => {
  return (
    <section className="py-15 px-10 md:px-20 bg-white">

      {/* Heading */}
      <h2 className="text-3xl font-bold mb-10">
        How to get <span className="text-[#6a0026]">Blood?</span>
      </h2>

      {/* Main container */}
      <div className="relative flex flex-col items-center">

        {/* ================= STEP 1 ================= */}
        {/* 
          🔧 MOVE STEP 1:
          - Up/Down: change mt-* or mb-*
          - Left/Right: add translate-x-*
        */}
        <div className="mb-2 mt-0">
          <img
            src={step1}
            alt="Step 1"
            className="w-68 h-68 object-contain"
          />
        </div>

        {/* ================= HEART LINE ================= */}
        {/* 
          🔧 MOVE HEART LINE:
          - Vertical: change top-[xx%]
          - Horizontal: add left-1/2 + -translate-x-1/2 OR translate-x-*
        */}
        <img
          src={heartLine}
          alt="Heart Line"
          className="
            hidden md:block
            absolute
            top-[58%]
            left-1/2
            -translate-x-1/2
            w-[420px]
          "
        />

        {/* ================= STEP 2 & STEP 3 ================= */}
        {/* 
          🔧 MOVE STEPS 2 & 3 TOGETHER:
          - Up/Down: add mt-* here
          - Gap between them: change gap-*
        */}
        <div className="flex flex-col md:flex-row gap-28 items-center mt-0">

          {/* STEP 2 */}
          {/* 
            🔧 MOVE STEP 2 ALONE:
            - Use translate-x-* or translate-y-*
          */}
          <div className="-translate-x-38 translate-y-">
            <img
              src={step2}
              alt="Step 2"
              className="w-68 h-68 object-contain"
            />
          </div>

          {/* STEP 3 */}
          {/* 
            🔧 MOVE STEP 3 ALONE:
            - Use translate-x-* or translate-y-*
          */}
          <div className="translate-x-34 translate-y-0">
            <img
              src={step3}
              alt="Step 3"
              className="w-68 h-68 object-contain"
            />
          </div>

        </div>
      </div>
    </section>
  );
};

export default HowToGetBlood;
