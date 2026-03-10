const About = () => {
  return (
    <div className="min-h-[calc(100vh-96px)] bg-white px-10 md:px-20 py-16">

      {/* PAGE TITLE */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold mb-4">
          About <span className="text-[#6a0026]">LifeLink</span>
        </h1>
        <p className="text-gray-600 max-w-3xl leading-relaxed">
          Life Link is a blood donation and emergency alert
          platform designed to ensure timely and
          reliable blood support during medical emergencies.
        </p>
      </div>

      {/* CONTENT SECTIONS */}
      <div className="space-y-16">

        {/* VISION */}
        <section>
          <h2 className="text-2xl font-semibold mb-3">Our Vision</h2>
          <p className="text-gray-600 max-w-4xl leading-relaxed">
            Our vision is to build a strong and responsive community
            where no one suffers due to the unavailability of blood.
            Life Link aims to make emergency blood support fast, organized,
            and trustworthy using technology.
          </p>
        </section>

        {/* MISSION */}
        <section>
          <h2 className="text-2xl font-semibold mb-3">Our Mission</h2>
          <ul className="list-disc pl-6 text-gray-600 space-y-2">
            <li>Reduce response time during medical emergencies</li>
            <li>Provide a secure authentication platform</li>
            <li>Connect verified donors with patients instantly</li>
            <li>Promote awareness and voluntary blood donation</li>
          </ul>
        </section>

        {/* WHY LIFELINK */}
        <section>
          <h2 className="text-2xl font-semibold mb-3">Why Life Link?</h2>
          <p className="text-gray-600 max-w-4xl leading-relaxed">
            During emergencies, people often depend on unorganized methods
            like WhatsApp messages or phone calls, which may not reach the
            right people on time. Life Link replaces this with a structured,
            authenticated system that ensures alerts reach only eligible
            donors quickly and securely.
          </p>
        </section>

        {/* HOW IT WORKS */}
        <section>
          <h2 className="text-2xl font-semibold mb-3">How It Helps</h2>
          <p className="text-gray-600 max-w-4xl leading-relaxed">
            When a blood request is raised, the system instantly notifies
            relevant donors. Donors can accept the request
            with a single click, and direct contact is enabled only after
            acceptance, ensuring privacy, trust, and faster coordination.
          </p>
        </section>

        {/* COMMITMENT */}
        <section className="bg-gray-50 p-8 rounded-xl">
          <h2 className="text-2xl font-semibold mb-3">Our Commitment</h2>
          <p className="text-gray-600 leading-relaxed">
            Life Link is committed to saving lives through technology while
            maintaining privacy, security, and reliability. We continuously
            work to improve the platform and make it more effective for
            real-world emergency situations.
          </p>
        </section>

      </div>
    </div>
  );
};

export default About;
