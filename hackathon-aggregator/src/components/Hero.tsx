export default function Hero() {
  return (
    <section className="pt-10 pb-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="max-w-2xl">
        <p className="text-sage-500 dark:text-sage-400 text-sm font-medium tracking-widest uppercase mb-2">
          Discover • Apply • Build
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold text-night-400 dark:text-cream-100 leading-tight">
          Find your next hackathon,{" "}
          <span className="text-sage-500 dark:text-sage-400">without the noise</span>
        </h1>
        <p className="mt-4 text-night-100 dark:text-cream-300 text-base leading-relaxed max-w-md">
          Curated hackathons from Devpost, MLH, Unstop, and more. Filter by mode, fee,
          location — apply in one click.
        </p>
      </div>
    </section>
  );
}
