export type TutorialOverlay = {
  update: (options: {
    step: number;
    totalSteps: number;
    title: string;
    description: string;
    progress: string;
  }) => void;
  destroy: () => void;
};

const ROOT_ID = "tutorial-overlay";

export const createTutorialOverlay = (
  parent: HTMLElement,
  exit: () => void,
): TutorialOverlay => {
  document.getElementById(ROOT_ID)?.remove();

  const root = document.createElement("aside");
  root.id = ROOT_ID;
  root.className = "tutorial-panel";
  root.innerHTML = `
    <div class="tutorial-panel__eyebrow" data-tutorial-step></div>
    <h2 data-tutorial-title></h2>
    <p data-tutorial-description></p>
    <div class="tutorial-panel__progress" data-tutorial-progress></div>
    <button type="button" data-tutorial-exit>ESCI DAL TUTORIAL</button>
  `;
  parent.appendChild(root);
  root.querySelector("[data-tutorial-exit]")?.addEventListener("click", exit);

  return {
    update: ({ step, totalSteps, title, description, progress }) => {
      setText(root, "[data-tutorial-step]", `ADDESTRAMENTO ${step}/${totalSteps}`);
      setText(root, "[data-tutorial-title]", title);
      setText(root, "[data-tutorial-description]", description);
      setText(root, "[data-tutorial-progress]", progress);
    },
    destroy: () => root.remove(),
  };
};

const setText = (root: HTMLElement, selector: string, value: string) => {
  const element = root.querySelector<HTMLElement>(selector);

  if (element) {
    element.textContent = value;
  }
};
