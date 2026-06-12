export default function CoveragePage() {
  return (
    <div className="min-h-screen pt-32 px-6 text-black">
      <div className="max-w-5xl mx-auto">

        <h1 className="text-5xl font-bold text-center mb-12">
          Service Coverage
        </h1>

        <div className="bg-white rounded-3xl p-8 shadow-lg">

          <p className="text-lg mb-6 text-black">
            EasyGo Spa currently serves the following areas:
          </p>

          <div className="grid md:grid-cols-2 gap-4 text-black">
            <div>Makati</div>
            <div>BGC</div>
            <div>Taguig</div>
            <div>Pasay</div>
            <div>Manila</div>
            <div>Quezon City</div>
            <div>Pasig</div>
            <div>Mandaluyong</div>
          </div>

        </div>

      </div>
    </div>
  );
}