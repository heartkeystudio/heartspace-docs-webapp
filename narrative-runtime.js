/* Shared by the editor preview and the standalone HTML player. No DOM or network. */
(function (root) {
  function createNarrativeRuntime() {
    const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
    const coerce = (value, type) => {
      if (type === 'boolean') return value === true || ['true', '1', 'sim', 'verdadeiro'].includes(String(value || '').trim().toLocaleLowerCase('pt-BR'));
      if (type === 'number') { const number = Number(String(value ?? '').replace(',', '.')); return Number.isFinite(number) ? number : 0; }
      return String(value ?? '');
    };
    const initialVariables = variables => Object.fromEntries((variables || []).map(variable => [variable.id, coerce(variable.default, variable.type)]));
    const conditionMatches = (condition, values) => {
      if (!condition?.variable) return true;
      if (!own(values, condition.variable)) return false;
      const current = values[condition.variable], expected = condition.value;
      switch (condition.operator) {
        case 'eq': return current === expected;
        case 'neq': return current !== expected;
        case 'gt': return typeof current === 'number' && current > expected;
        case 'gte': return typeof current === 'number' && current >= expected;
        case 'lt': return typeof current === 'number' && current < expected;
        case 'lte': return typeof current === 'number' && current <= expected;
        default: return false;
      }
    };
    const resolveVariation = (node, values) => {
      const versions = node.versions || [];
      const fallback = versions.find(version => version.id === node.default_version_id) || versions.find(version => version.id === node.active_version_id) || versions[0];
      return versions.find(version => version !== fallback && version.condition?.variable && conditionMatches(version.condition, values)) || fallback;
    };
    const applyEffects = (effects, values) => {
      (effects || []).forEach(effect => {
        if (!effect?.variable || !own(values, effect.variable)) return;
        if (effect.operation === 'toggle') values[effect.variable] = !values[effect.variable];
        else if (effect.operation === 'add') values[effect.variable] = Number(values[effect.variable] || 0) + Number(effect.value || 0);
        else if (effect.operation === 'subtract') values[effect.variable] = Number(values[effect.variable] || 0) - Number(effect.value || 0);
        else if (effect.operation === 'set') values[effect.variable] = effect.value;
      });
    };
    const reachableSequences = (sequences, startId) => {
      const groups = new Map();
      (sequences || []).forEach(sequence => {
        const group = groups.get(sequence.event_id) || [];
        group.push(sequence); groups.set(sequence.event_id, group);
      });
      const included = [], missing = [], duplicates = [], visited = new Set(), pending = [startId];
      while (pending.length) {
        const id = pending.shift();
        if (visited.has(id)) continue;
        visited.add(id);
        const group = groups.get(id);
        if (!group) { missing.push(id); continue; }
        if (group.length > 1) duplicates.push(id);
        included.push(group[0]);
        (group[0].nodes || []).filter(node => node.type === 'choice').forEach(node => {
          (node.options || []).forEach(option => { if (option.target_event) pending.push(option.target_event); });
        });
      }
      return { sequences: included, missing, duplicates };
    };
    const createRunner = story => {
      const sequences = new Map((story.sequences || []).map(sequence => [sequence.event_id, sequence]));
      const state = { eventId:story.start_event_id, index:0, variables:initialVariables(story.variable_registry) };
      const current = () => {
        const sequence = sequences.get(state.eventId);
        const node = sequence?.nodes?.[state.index];
        return { sequence, node, ended:!!sequence && !node, missing:!sequence };
      };
      const snapshot = () => ({ eventId:state.eventId, index:state.index, variables:{ ...state.variables } });
      const restore = saved => {
        if (!sequences.has(saved?.eventId) || !Number.isInteger(saved.index) || saved.index < 0) return false;
        state.eventId = saved.eventId; state.index = saved.index;
        state.variables = { ...saved.variables };
        return true;
      };
      const advance = () => {
        const { node } = current();
        if (!node || node.type === 'choice') return false;
        state.index += 1;
        return true;
      };
      const choose = optionIndex => {
        const { node } = current();
        const option = node?.type === 'choice' ? node.options?.[optionIndex] : null;
        if (!option || !conditionMatches(option.condition, state.variables) || !sequences.has(option.target_event)) return false;
        applyEffects(option.effects, state.variables);
        state.eventId = option.target_event; state.index = 0;
        return true;
      };
      const restart = () => {
        state.eventId = story.start_event_id; state.index = 0;
        state.variables = initialVariables(story.variable_registry);
      };
      return { state, current, snapshot, restore, advance, choose, restart };
    };
    return { coerce, initialVariables, conditionMatches, resolveVariation, applyEffects, reachableSequences, createRunner };
  }
  const runtime = createNarrativeRuntime();
  runtime.source = createNarrativeRuntime.toString();
  root.HeartspaceNarrativeRuntime = runtime;
})(globalThis);
