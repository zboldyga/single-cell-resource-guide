(() => {
  "use strict";
  const $ = (selector) => document.querySelector(selector);
  const catalog = window.RESOURCE_CATALOG;
  const resources = Array.isArray(catalog?.resources) ? catalog.resources : [];
  const typeLabels = { primary: "Primary data", aggregator: "Aggregator", standard: "Ontology / standard", tool: "Analysis tool" };
  const statusLabels = { yes: "Available", no: "Not available", unknown: "Unknown", not_applicable: "Not applicable" };
  const fieldLabels = { id: "Identity", name: "Name", url: "Official website", purpose: "Purpose", question: "Research question", key_data: "Key data", categories: "Categories", modalities: "Data types", species: "Species", biological_scope: "Biological scope", granularity: "Granularity", resource_type: "Resource type", maintainer: "Maintainer", scale: "Scale", summary: "Summary", as_of: "Source date", source_url: "Source", release: "Substantive release", label: "Release name", date: "Release date", note: "Notes", access: "Access", web: "Web", api: "API", bulk: "Bulk download", status: "Availability", licensing: "Licensing", not_for: "Limitations", sources: "Evidence", verification: "Verification", related: "Related resources" };
  const state = { query: "", coreOnly: false, categories: new Set(), modalities: new Set(), sort: "name", direction: 1, expanded: new Set() };
  const compare = new Intl.Collator("en", { sensitivity: "base", numeric: true });
  const byId = new Map(resources.map((resource) => [resource.id, resource]));
  const value = (input) => input == null || input === "" ? "Unknown" : String(input);
  const list = (input) => Array.isArray(input) ? input : [];
  const unknown = (input) => !input || /^(unknown|unverified|not verified)\b/i.test(String(input));
  const normalize = (input) => String(input).normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const flatten = (input) => Array.isArray(input) ? input.map(flatten).join(" ") : input && typeof input === "object" ? Object.values(input).map(flatten).join(" ") : input == null ? "" : String(input);
  const searchable = new Map(resources.map(({ related, sources, ...resource }) => [resource.id, normalize(flatten(resource) + " " + typeLabels[resource.resource_type])]));
  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function safeURL(input) {
    if (typeof input !== "string" || !/^https?:\/\//i.test(input)) return null;
    try { const url = new URL(input); return ["http:", "https:"].includes(url.protocol) ? url.href : null; } catch { return null; }
  }
  function link(text, url, className) {
    const target = safeURL(url);
    const node = el(target ? "a" : "span", className, text);
    if (target) { node.href = target; node.rel = "noopener noreferrer"; }
    return node;
  }
  function date(input) {
    if (!input || !/^\d{4}-\d{2}-\d{2}$/.test(input)) return "Unknown";
    const parsed = new Date(input + "T00:00:00Z");
    return Number.isNaN(parsed.getTime()) ? "Unknown" : new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(parsed);
  }
  function sourceLink(url, text = "Source") { return link(text, url); }
  function paragraph(parent, text, className) { const p = el("p", className, text); parent.append(p); return p; }
  function block(title) { const node = el("section", "detail-block"); node.append(el("h4", "", title)); return node; }
  function definition(parent, label, text) { const dl = el("dl"); dl.append(el("dt", "", label), el("dd", "", value(text))); parent.append(dl); }
  function humanFields(fields) {
    return list(fields).map((field) => String(field).split(".").map((part) => fieldLabels[part] || part.replace(/_/g, " ")).join(" / ")).join(", ");
  }
  function uncertainty(resource) {
    const items = [];
    if (unknown(resource.scale?.summary)) items.push("scale"); else if (!resource.scale?.as_of) items.push("scale date");
    if (unknown(resource.release?.label)) items.push("release"); else if (!resource.release?.date) items.push("release date");
    if (unknown(resource.licensing?.summary)) items.push("licensing");
    for (const [key, label] of [["web", "web access"], ["api", "API"], ["bulk", "bulk access"]]) if (!resource.access?.[key] || resource.access[key].status === "unknown") items.push(label);
    return items;
  }
  function detailDisclosure(title, description) {
    const disclosure = el("details", "detail-disclosure");
    const summary = el("summary");
    const heading = el("span", "disclosure-heading", title);
    heading.append(el("span", "disclosure-description", description));
    summary.append(heading);
    const content = el("div", "disclosure-content");
    disclosure.append(summary, content);
    return { disclosure, content };
  }
  function selectCommand(code) {
    code.parentElement.focus();
    const selection = window.getSelection();
    if (!selection) return false;
    const range = document.createRange();
    range.selectNodeContents(code);
    selection.removeAllRanges();
    selection.addRange(range);
    return true;
  }
  function legacyCopy(command, button) {
    const input = el("textarea", "clipboard-buffer");
    input.value = command;
    input.readOnly = true;
    input.setAttribute("aria-label", "Download command");
    document.body.append(input);
    input.select();
    input.setSelectionRange(0, command.length);
    let copied = false;
    try { copied = document.execCommand("copy"); } catch { /* Manual selection remains available. */ }
    input.remove();
    button.focus({ preventScroll: true });
    return copied;
  }
  function downloadExample(example, id) {
    const card = el("article", "download-example");
    const heading = el("h5", "", value(example.label));
    heading.id = id + "-title";
    card.setAttribute("aria-labelledby", heading.id);
    card.append(heading);
    if (example.description) paragraph(card, example.description, "download-description");
    if (list(example.requirements).length) {
      const requirements = el("div", "download-requirements");
      requirements.append(el("strong", "", "Before you run"));
      const items = el("ul");
      example.requirements.forEach((item) => items.append(el("li", "", item)));
      requirements.append(items);
      card.append(requirements);
    }
    const terminal = el("div", "command-terminal");
    const toolbar = el("div", "command-toolbar");
    toolbar.append(el("span", "command-language", "Bash"));
    const copy = el("button", "copy-command", "Copy command");
    copy.type = "button";
    copy.setAttribute("aria-label", "Copy Bash command: " + value(example.label));
    copy.setAttribute("aria-describedby", id + "-feedback");
    toolbar.append(copy);
    const pre = el("pre", "command-code");
    pre.tabIndex = 0;
    pre.setAttribute("aria-label", "Bash command for " + value(example.label));
    const code = el("code", "", example.command);
    pre.append(code);
    const feedback = el("p", "copy-feedback");
    feedback.id = id + "-feedback";
    feedback.setAttribute("role", "status");
    feedback.setAttribute("aria-live", "polite");
    feedback.setAttribute("aria-atomic", "true");
    copy.addEventListener("click", async () => {
      copy.disabled = true;
      let copied = false;
      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(example.command);
          copied = true;
        }
      } catch { /* Try the local-file / denied-permission fallback below. */ }
      if (!copied) copied = legacyCopy(example.command, copy);
      copy.disabled = false;
      if (copied) {
        copy.focus({ preventScroll: true });
        copy.textContent = "Copied";
        feedback.textContent = "Command copied to clipboard.";
      } else {
        copy.textContent = "Copy command";
        feedback.textContent = selectCommand(code)
          ? "Command selected. Press Ctrl+C (Windows/Linux) or ⌘C (Mac) to copy."
          : "Clipboard unavailable. Select the command above and copy it manually.";
      }
    });
    terminal.append(toolbar, pre);
    card.append(terminal, feedback);
    const provenance = el("p", "download-provenance");
    provenance.append(sourceLink(example.source_url, "Official download instructions"), el("span", "", "Checked " + date(example.checked_on)));
    card.append(provenance);
    return card;
  }
  function makeDetails(resource, panelId) {
    const panel = el("div", "detail-panel");
    panel.id = panelId;
    const header = el("div", "detail-header");
    const heading = el("div");
    paragraph(heading, resource.name, "detail-eyebrow");
    const title = el("h3", "", "Access & downloads");
    title.id = panelId + "-title";
    heading.append(title);
    paragraph(heading, "Choose an access route, then explore the dataset and its sources.", "detail-introduction");
    const verified = resource.verification?.status === "verified";
    const badge = el("span", "detail-verification " + (verified ? "is-verified" : "is-provisional"), verified ? "Core details source-checked" : "Provisional · needs checking");
    badge.append(el("span", "", "Checked " + date(resource.verification?.checked_on)));
    header.append(heading, badge);
    panel.setAttribute("role", "region");
    panel.setAttribute("aria-labelledby", title.id);
    panel.append(header);
    const accessGrid = el("div", "access-cards");
    for (const [key, label, action] of [["web", "Browse online", "Open website"], ["api", "API / programmatic", "View API / documentation"], ["bulk", "Download files", "Open downloads"]]) {
      const method = resource.access?.[key] || { status: "unknown", note: "Not verified" };
      const card = el("section", "access-card");
      const cardHeader = el("div", "access-card-header");
      cardHeader.append(el("h4", "", label));
      const status = Object.hasOwn(statusLabels, method.status) ? method.status : "unknown";
      cardHeader.append(el("span", "access-state access-" + status, statusLabels[status]));
      card.append(cardHeader);
      paragraph(card, method.note || (status === "unknown" ? "This access route has not been verified." : "No additional access notes recorded."), "access-note");
      if (safeURL(method.url)) card.append(link(action + " ↗", method.url, "access-action"));
      accessGrid.append(card);
    }
    panel.append(accessGrid);
    const licensing = el("aside", "licensing-note");
    licensing.append(el("h4", "", "Licensing & access restrictions"));
    paragraph(licensing, value(resource.licensing?.summary));
    if (safeURL(resource.licensing?.source_url)) licensing.append(sourceLink(resource.licensing.source_url, "Read licensing / access terms ↗"));
    panel.append(licensing);
    const downloads = el("section", "download-section");
    downloads.append(el("h4", "", "Download from your terminal"));
    const examples = list(resource.download_examples).filter((example) => example && typeof example.command === "string" && example.command.trim());
    if (examples.length) {
      paragraph(downloads, "Copy an example below. Check its scope and requirements before running it locally.", "detail-meta");
      examples.forEach((example, index) => downloads.append(downloadExample(example, panelId + "-download-" + index)));
    } else {
      const empty = el("div", "download-empty");
      paragraph(empty, "No verified Bash example is included for this resource.");
      paragraph(empty, "Follow the download instructions above to select files, sign in, or generate a command for your selection.", "detail-meta");
      if (safeURL(resource.access?.bulk?.url)) empty.append(link("Choose files on the official download page ↗", resource.access.bulk.url));
      downloads.append(empty);
    }
    panel.append(downloads);
    const dataset = detailDisclosure("Dataset & release details", "Biological scope, data types, scale and release history");
    const metadataGrid = el("div", "metadata-grid");
    const scope = block("Biological scope");
    paragraph(scope, value(resource.biological_scope));
    definition(scope, "Species", list(resource.species).join(" · "));
    definition(scope, "Granularity", list(resource.granularity).join(" · "));
    definition(scope, "Categories", list(resource.categories).join(" · "));
    definition(scope, "Maintainer", resource.maintainer);
    definition(scope, "Resource type", typeLabels[resource.resource_type] || "Unknown");
    const modalities = el("div", "modality-group");
    modalities.append(el("h5", "", "Data types"));
    const chips = el("ul", "detail-chips");
    for (const modality of list(resource.modalities)) chips.append(el("li", "", modality));
    if (chips.children.length) modalities.append(chips); else paragraph(modalities, "Unknown");
    scope.append(modalities);
    const scale = block("Scale & substantive release");
    definition(scale, "Approximate scale", resource.scale?.summary);
    paragraph(scale, "Scale source date: " + date(resource.scale?.as_of), "detail-meta");
    if (safeURL(resource.scale?.source_url)) scale.append(sourceLink(resource.scale.source_url, "Scale evidence ↗"));
    definition(scale, "Substantive data release", resource.release?.label);
    paragraph(scale, "Release date: " + date(resource.release?.date), "detail-meta");
    if (resource.release?.note) paragraph(scale, resource.release.note);
    if (safeURL(resource.release?.source_url)) scale.append(sourceLink(resource.release.source_url, "Release evidence ↗"));
    paragraph(scale, "A website update is not a data release.", "detail-meta");
    metadataGrid.append(scope, scale);
    dataset.content.append(metadataGrid);
    const evidence = detailDisclosure("Sources & verification", "Official references, known gaps and related resources");
    const evidenceGrid = el("div", "metadata-grid evidence-grid");
    const citations = block("Cited sources");
    const sources = el("ol", "source-list");
    for (const source of list(resource.sources)) {
      const li = el("li");
      li.append(sourceLink(source.url, value(source.title)));
      li.append(el("span", "source-supports", (source.type === "official" ? "Official source" : "Research paper") + " · checked " + date(source.checked_on)));
      li.append(el("span", "source-supports", "Supports: " + (humanFields(source.supports) || "Not specified")));
      sources.append(li);
    }
    if (sources.children.length) citations.append(sources); else paragraph(citations, "No sources recorded.");
    const verification = block("Verification & related resources");
    paragraph(verification, verified ? "Core details checked against official sources" : "Provisional · core details need verification");
    paragraph(verification, "Checked: " + date(resource.verification?.checked_on), "detail-meta");
    paragraph(verification, value(resource.verification?.note));
    const missing = uncertainty(resource);
    if (missing.length) paragraph(verification, "Unknown: " + missing.join(" · "), "uncertainty");
    paragraph(verification, "This status does not establish complete metadata, current data, or unrestricted reuse.", "detail-meta");
    const related = list(resource.related).map((id) => byId.get(id)).filter(Boolean);
    if (related.length) {
      const relatedGroup = el("div", "related-group");
      relatedGroup.append(el("h5", "", "Related resources"));
      const links = el("div", "related-links");
      for (const relatedResource of related) links.append(link(relatedResource.name + " ↗", relatedResource.url));
      relatedGroup.append(links);
      verification.append(relatedGroup);
    } else paragraph(verification, "No related resources listed.", "detail-meta");
    evidenceGrid.append(citations, verification);
    evidence.content.append(evidenceGrid);
    panel.append(dataset.disclosure, evidence.disclosure);
    return panel;
  }
  function renderRow(resource, index) {
    const row = el("tr", "resource-row");
    const nameCell = el("th"); nameCell.scope = "row";
    const name = link(resource.name, resource.url, "resource-name");
    const externalMark = el("span", "external-mark", "↗"); externalMark.setAttribute("aria-hidden", "true"); name.append(externalMark); nameCell.append(name);
    const type = Object.hasOwn(typeLabels, resource.resource_type) ? resource.resource_type : "unknown";
    nameCell.append(el("span", "resource-type type-" + type, typeLabels[type] || "Unknown type"));
    paragraph(nameCell, list(resource.categories).join(" · "), "resource-categories");
    if (resource.verification?.status !== "verified") nameCell.append(el("span", "verification-label provisional", "Provisional"));
    const detailsRow = el("tr", "details-row"); const detailsCell = el("td"); detailsCell.colSpan = 4;
    const panelId = "resource-detail-" + resource.id;
    detailsRow.hidden = !state.expanded.has(resource.id);
    const toggle = el("button", "detail-toggle", detailsRow.hidden ? "Access & details +" : "Close details −");
    toggle.type = "button"; toggle.setAttribute("aria-expanded", String(!detailsRow.hidden)); toggle.setAttribute("aria-controls", panelId);
    toggle.setAttribute("aria-label", (detailsRow.hidden ? "Show" : "Hide") + " access and details for " + resource.name);
    toggle.addEventListener("click", () => {
      const open = detailsRow.hidden; detailsRow.hidden = !open;
      if (open) state.expanded.add(resource.id); else state.expanded.delete(resource.id);
      toggle.setAttribute("aria-expanded", String(open)); toggle.setAttribute("aria-label", (open ? "Hide" : "Show") + " access and details for " + resource.name);
      toggle.textContent = open ? "Close details −" : "Access & details +";
    });
    nameCell.append(toggle);
    const data = el("td", "cell-data");
    paragraph(data, value(resource.purpose), "cell-purpose");
    const dataList = el("ul", "data-list");
    const keyData = list(resource.key_data).length ? resource.key_data : list(resource.modalities);
    for (const item of keyData) {
      const bullet = el("li");
      const labelEnd = item.indexOf(": ");
      if (labelEnd > 0 && labelEnd < 45) {
        bullet.append(el("strong", "data-label", item.slice(0, labelEnd + 1)), document.createTextNode(item.slice(labelEnd + 1)));
      } else bullet.textContent = item;
      dataList.append(bullet);
    }
    data.append(dataList);
    const question = el("td", "cell-question"); paragraph(question, value(resource.question), "question-text");
    const caveat = el("td", "cell-caveat", value(resource.not_for));
    row.append(nameCell, data, question, caveat);
    detailsCell.append(makeDetails(resource, panelId)); detailsRow.append(detailsCell);
    return [row, detailsRow];
  }
  function sortValue(resource) {
    if (state.sort === "checked_on") return resource.verification?.checked_on || null;
    if (state.sort === "resource_type") return typeLabels[resource.resource_type] || null;
    return resource.name || null;
  }
  function render() {
    const terms = normalize(state.query.trim()).split(/\s+/).filter(Boolean);
    const filtered = resources.filter((resource) => (!state.coreOnly || /cellxgene|gtex|depmap/i.test(resource.name)) && terms.every((term) => searchable.get(resource.id).includes(term)) && (!state.categories.size || list(resource.categories).some((category) => state.categories.has(category))) && (!state.modalities.size || list(resource.modalities).some((modality) => state.modalities.has(modality))));
    const originalPosition = new Map(resources.map((resource, index) => [resource.id, index]));
    filtered.sort((a, b) => {
      const av = sortValue(a), bv = sortValue(b);
      if (av === null && bv !== null) return 1; if (bv === null && av !== null) return -1;
      return (av === null && bv === null ? 0 : compare.compare(av, bv) * state.direction) || originalPosition.get(a.id) - originalPosition.get(b.id);
    });
    const fragment = document.createDocumentFragment();
    filtered.forEach((resource, index) => fragment.append(...renderRow(resource, index)));
    $("#resource-rows").replaceChildren(fragment);
    $("#result-count").textContent = filtered.length + " of " + resources.length + " resources";
    $("#empty-state").hidden = !!filtered.length || !resources.length;
    $("#category-selection").textContent = state.categories.size ? state.categories.size + " selected" : "All";
    $("#modality-selection").textContent = state.modalities.size ? state.modalities.size + " selected" : "All";
    $("#compare-core").setAttribute("aria-pressed", String(state.coreOnly));
    renderSelectedFilters();
    const sortName = { name: "name", resource_type: "resource type", checked_on: "date checked" }[state.sort];
    const direction = state.direction === 1 ? "ascending" : "descending";
    $("#resource-heading").setAttribute("aria-sort", direction);
    $("#resource-heading").setAttribute("aria-label", "Resource, sorted by " + sortName + ", " + direction);
    for (const button of document.querySelectorAll("[data-sort]")) {
      const active = button.dataset.sort === state.sort;
      button.setAttribute("aria-pressed", String(active));
      const label = { name: "Name", resource_type: "Type", checked_on: "Checked" }[button.dataset.sort];
      button.textContent = label + (active ? state.direction === 1 ? " ↑" : " ↓" : "");
      button.setAttribute("aria-label", "Sort by " + { name: "name", resource_type: "resource type", checked_on: "date checked" }[button.dataset.sort] + (active ? ", currently " + direction : ""));
    }
  }
  function filters(key, selector) {
    const values = [...new Set(resources.flatMap((resource) => list(resource[key])))].sort(compare.compare);
    const container = $(selector);
    for (const item of values) {
      const label = el("label", "filter-choice"); const input = el("input"); input.type = "checkbox"; input.value = item;
      input.addEventListener("change", () => { if (input.checked) state[key].add(item); else state[key].delete(item); render(); });
      label.append(input, el("span", "", item)); container.append(label);
    }
  }
  function renderSelectedFilters() {
    const container = $("#selected-filters");
    const fragment = document.createDocumentFragment();
    for (const key of ["categories", "modalities"]) for (const item of state[key]) {
      const button = el("button", "selected-filter", item + " ×");
      button.type = "button";
      button.setAttribute("aria-label", "Remove " + (key === "categories" ? "category" : "data type") + " filter: " + item);
      button.addEventListener("click", () => {
        state[key].delete(item);
        for (const input of document.querySelectorAll("#" + key + " input")) if (input.value === item) input.checked = false;
        render(); $("#" + (key === "categories" ? "category-filter" : "modality-filter") + " summary").focus();
      });
      fragment.append(button);
    }
    container.replaceChildren(fragment);
    container.hidden = !container.children.length;
  }
  function reset() {
    state.query = ""; state.coreOnly = false; state.categories.clear(); state.modalities.clear(); $("#search").value = "";
    for (const input of document.querySelectorAll(".filter-choice input")) input.checked = false;
    render(); $("#search").focus();
  }
  filters("categories", "#categories"); filters("modalities", "#modalities");
  const filterGroups = [...document.querySelectorAll(".filter-group")];
  for (const group of filterGroups) {
    group.addEventListener("toggle", () => {
      if (group.open) for (const other of filterGroups) if (other !== group) other.open = false;
    });
    group.addEventListener("keydown", (event) => {
      if (event.key === "Escape") { group.open = false; group.querySelector("summary").focus(); }
    });
  }
  document.addEventListener("click", (event) => {
    for (const group of filterGroups) if (!group.contains(event.target)) group.open = false;
  });
  $("#search").addEventListener("input", (event) => { state.query = event.target.value; render(); });
  $("#clear-filters").addEventListener("click", reset); $("#reset-empty").addEventListener("click", reset);
  $("#compare-core").addEventListener("click", () => {
    const next = !state.coreOnly;
    reset(); state.coreOnly = next; render(); $("#compare-core").focus();
  });
  for (const button of document.querySelectorAll("[data-sort]")) button.addEventListener("click", () => {
    if (state.sort === button.dataset.sort) state.direction *= -1; else { state.sort = button.dataset.sort; state.direction = state.sort === "checked_on" ? -1 : 1; }
    render();
  });
  if (!catalog || !Array.isArray(catalog.resources)) {
    $("#load-error").hidden = false;
    $("#load-error").textContent = "The resource catalog could not be loaded. Keep resources.js beside this page; the handoff instructions explain how to build the local catalog.";
  } else if (!resources.length) {
    $("#load-error").hidden = false; $("#load-error").textContent = "The catalog has no resources yet.";
  }
  const checked = resources.filter((resource) => resource.verification?.status === "verified").length;
  $("#catalog-totals").textContent = checked + " core checked · " + (resources.length - checked) + " provisional";
  if (catalog?.updated_at) $("#edition").textContent = "Catalog updated " + date(catalog.updated_at);
  render();
})();
