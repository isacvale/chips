const loadedTags = [];

const makeContainer = (target) => {
  const newContainer = document.createElement("div");
  newContainer.id = target;
  return document.body.appendChild(newContainer);
};

const isNewCustomTag = (tagName) => {
  if (!tagName.includes("-")) return false;
  if (loadedTags.includes(tagName)) return false;
  return true;
};

const fetchMarkUp = async (tagName, path) => {
  try {
    const content = fetch(`${path}/${tagName}.html`);
    return (await content).text();
  } catch (error) {
    console.warn(`Component <${tagName}> could not be fetched: ${error}`);
  }
};

const injectMarkUp = (markUp) => {
  if (!markUp) return false;
  const markUpFragment = document.createDocumentFragment();
  const container = document.createElement("div");
  container.innerHTML = markUp;
  while (container.firstChild) markUpFragment.appendChild(container.firstChild);
  return markUpFragment;
};

const activateScripts = (fragment) => {
  if (!fragment) return;
  fragment.querySelectorAll("script").forEach((script) => {
    const newScriptElement = document.createElement("script");
    if (script.getAttribute("type") === "module")
      newScriptElement.setAttribute("type", "module");
    newScriptElement.appendChild(document.createTextNode(script.innerHTML));
    const container = script.parentElement || fragment;
    container.appendChild(newScriptElement);
    container.removeChild(script);
  });
};

const parseElement = async (tagName, el, path, container) => {
  loadedTags.push(tagName);
  const markUp = await fetchMarkUp(tagName, path);
  const fragment = injectMarkUp(markUp);
  activateScripts(fragment);
  fragment && container.append(fragment);
  el.shadowRoot && monitorElements(el.shadowRoot.childNodes);
};

const getPath = (tagName) => {
  const pathsDict = window.config?.chips?.paths;
  const pathDefault = window.config?.chips?.path;
  return (pathsDict && pathsDict[tagName]) || pathDefault || "/components";
};

const monitorElements = (container) => (mutationList) => {
  mutationList.forEach(async (mutation) => {
    if (mutation.type !== "childList") return;

    const el = mutation.addedNodes ? mutation.addedNodes[0] : mutation;
    if (!(el instanceof HTMLElement)) return;

    monitorElements(el.childNodes);

    const tagName = el.tagName.toLowerCase();
    if (!isNewCustomTag(tagName)) return;

    const path = getPath(tagName);

    const intersectionObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            observer.unobserve(el);
            parseElement(tagName, el, path, container);
          }
        });
      },
      {
        rootMargin: "10%",
      }
    );
    intersectionObserver.observe(el);
  });
};

const intersectsViewPort = (entries, observer) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) console.log("It hits");
  });
};

const chips = ({ target = "_chips" } = {}) => {
  const container = makeContainer(target);

  const mutationObserver = new MutationObserver(monitorElements(container));
  mutationObserver.observe(document, { childList: true, subtree: true });

  return { loadedTags };
};

chips(window.config?.chips);
