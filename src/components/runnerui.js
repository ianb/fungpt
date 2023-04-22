import { useEffect } from "preact/hooks";

export const RunnerUI = ({ runner }) => {
  useEffect(() => {
    runner.start();
  }, []);
  return (
    <section class="section">
      <div class="container">
        <div class="columns">
          {Object.entries(runner.zones).map(([name, zone]) => (
            <div class="column">
              <zone.Component />
            </div>
          ))}
          <div class="column">
            <runner.gpt.Component />
          </div>
        </div>
      </div>
    </section >
  );
};
