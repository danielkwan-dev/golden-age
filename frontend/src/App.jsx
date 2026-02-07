import "./App.css";

export default function App() {
  return (
    <div className="page">
      <header className="hero">
        <p className="eyebrow">Golden Age of Information</p>
        <h1>Contextual Grounding for a more trustworthy web</h1>
        <p className="subhead">
          This is the frontend scaffold for the browser extension. We will use
          it to surface lineage tracing, rhetorical bias signals, and locally
          relevant context.
        </p>
        <div className="cta-row">
          <button className="primary">Explore Prototype</button>
          <button className="secondary">View Methodology</button>
        </div>
      </header>
      <section className="grid">
        <div className="card">
          <h2>Lineage Tracing</h2>
          <p>
            Track the origin of viral images and claims to see where they first
            appeared and how they evolved.
          </p>
        </div>
        <div className="card">
          <h2>Rhetorical Bias</h2>
          <p>
            Score framing and emotional language so readers can separate facts
            from persuasion tactics.
          </p>
        </div>
        <div className="card">
          <h2>Local Relevance</h2>
          <p>
            Highlight context from local sources to rebuild trust in the
            community-level news ecosystem.
          </p>
        </div>
      </section>
    </div>
  );
}
