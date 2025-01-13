<script setup lang="ts">
import { markRaw, ref } from 'vue'
import { VueFlow } from '@vue-flow/core'
import TestEdge1 from './components/TestEdge1.vue'
import type { EdgeComponent } from '@vue-flow/core'

const nodes = ref([
  {
    id: '1',
    position: { x: 50, y: 50 },
    data: { label: 'Node 1' }
  },
  {
    id: '2',
    position: { x: 50, y: 250 },
    data: { label: 'Node 2' }
  }
])

const edges = ref([
  {
    id: 'e1->2',
    source: '1',
    target: '2',
    type: 'test1'
  }
])

const edgesType: Record<string, EdgeComponent> = {
  test1: markRaw(TestEdge1) as EdgeComponent
}
</script>

<template>
  <div class="flow-box">
    <VueFlow :nodes="nodes" :edges="edges" :edge-types="edgesType"> </VueFlow>
  </div>
</template>

<style>
@import '@vue-flow/core/dist/style.css';

@import '@vue-flow/core/dist/theme-default.css';
html,
body {
  padding: 0;
  margin: 0;
}

.flow-box {
  width: 100vw;
  height: 100vh;
}
</style>
