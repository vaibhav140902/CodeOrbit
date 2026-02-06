import { Link } from "react-router-dom";

export const About = () => {
  const stats = [
    { label: "Active Users", value: "500+", icon: "👥" },
    { label: "Coding Problems", value: "150+", icon: "💻" },
    { label: "Daily Submissions", value: "1000+", icon: "📊" },
    { label: "Success Rate", value: "85%", icon: "🎯" }
  ];

  const features = [
    {
      icon: "🚀",
      title: "Diverse Challenges",
      description: "From beginner-friendly to advanced algorithms, we've got problems for every skill level."
    },
    {
      icon: "🌍",
      title: "Real-World Relevance",
      description: "Practice with problems that mirror actual coding interviews and industry scenarios."
    },
    {
      icon: "🎨",
      title: "User-Friendly Interface",
      description: "Clean, modern design that makes coding practice enjoyable and distraction-free."
    },
    {
      icon: "📈",
      title: "Track Your Progress",
      description: "Monitor your growth with detailed statistics, leaderboards, and achievement tracking."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white py-12 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-6">
            About Vaibhav's Code
          </h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
            Your go-to platform for honing coding skills and connecting with a vibrant developer community.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 text-center hover:border-purple-500 transition-all duration-300 hover:scale-105"
            >
              <div className="text-4xl mb-2">{stat.icon}</div>
              <div className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-gray-400">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Mission Statement */}
        <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-2xl p-8 mb-16 backdrop-blur-sm">
          <h2 className="text-3xl font-bold mb-4 flex items-center gap-3">
            <span>🎯</span>
            Our Mission
          </h2>
          <p className="text-lg text-gray-300 leading-relaxed mb-4">
            We provide a diverse set of challenges, real-world relevance, and a user-friendly interface to make your coding journey enjoyable and impactful. Whether you're a beginner taking your first steps or a seasoned developer sharpening your skills, join us in the pursuit of coding excellence.
          </p>
          <p className="text-lg text-gray-300 leading-relaxed">
            Unlock your coding potential with <span className="font-semibold text-purple-400">Vaibhav's Code</span>, where every challenge is an opportunity to grow and every line of code brings us closer together.
          </p>
        </div>

        {/* Features Grid */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">
            Why Choose Us?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 hover:border-purple-500 transition-all duration-300 group"
              >
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3 group-hover:text-purple-400 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Inspirational Quote */}
        <div className="bg-gray-900/50 border border-gray-700 rounded-2xl p-8 text-center mb-16">
          <div className="text-6xl mb-4">💡</div>
          <blockquote className="text-2xl font-light italic text-gray-300 mb-4">
            "If code isn't a daily adventure, then what is?"
          </blockquote>
          <p className="text-gray-500">- Vaibhav's Code Platform</p>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Start Your Journey?</h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/problems"
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-semibold text-lg shadow-2xl hover:shadow-purple-500/50 transform hover:scale-105 transition-all duration-300"
            >
              Browse Problems →
            </Link>
            <Link
              to="/leaderboard"
              className="px-8 py-4 bg-gray-800 border-2 border-gray-700 rounded-xl font-semibold text-lg hover:bg-gray-700 hover:border-purple-500 transform hover:scale-105 transition-all duration-300"
            >
              View Leaderboard
            </Link>
          </div>
        </div>

        {/* Tech Stack (Optional) */}
        <div className="mt-16 text-center">
          <h3 className="text-xl font-bold mb-4 text-gray-400">Built With</h3>
          <div className="flex flex-wrap justify-center gap-4">
            {['React', 'TypeScript', 'Firebase', 'Tailwind CSS', 'Vite'].map((tech) => (
              <span
                key={tech}
                className="px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-sm text-gray-300"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};