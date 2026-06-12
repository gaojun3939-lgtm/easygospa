export default function PricingPage() {
  return (
    <div className="min-h-screen pt-32 px-6">
      <div className="max-w-5xl mx-auto">

        <h1 className="text-5xl font-bold text-center mb-12">
          Pricing
        </h1>

        <div className="bg-white rounded-3xl p-8 shadow-lg">

          <div className="flex justify-between py-4 border-b">
            <span>Swedish Massage</span>
            <span>₱2,500</span>
          </div>

          <div className="flex justify-between py-4 border-b">
            <span>Japanese Head Spa</span>
            <span>₱3,500</span>
          </div>

          <div className="flex justify-between py-4 border-b">
            <span>Thai Dry Massage</span>
            <span>₱3,000</span>
          </div>

          <div className="flex justify-between py-4 border-b">
            <span>Foot Massage</span>
            <span>₱1,500</span>
          </div>

          <div className="flex justify-between py-4 border-b">
            <span>Head & Shoulder Massage</span>
            <span>₱1,200</span>
          </div>

          <div className="flex justify-between py-4">
            <span>Deep Tissue Massage</span>
            <span>₱3,500</span>
          </div>

        </div>
      </div>
    </div>
  );
}