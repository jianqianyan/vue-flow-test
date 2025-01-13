<!-- TestEdge1.vue -->
<script setup lang="ts">
import { BaseEdge, EdgeLabelRenderer } from '@vue-flow/core'
import { computed } from 'vue'
import usePoint from './usePoint'

const props = defineProps({
  id: {
    type: String,
    required: true
  },
  sourceX: {
    type: Number,
    required: true
  },
  sourceY: {
    type: Number,
    required: true
  },
  targetX: {
    type: Number,
    required: true
  },
  targetY: {
    type: Number,
    required: true
  },
  data: {
    type: Object,
    required: false,
    default: () => ({ text: '' })
  },
  style: {
    type: Object,
    required: false
  }
})

const { nodes, path, onPointDown } = usePoint(
  { x: computed(() => props.sourceX), y: computed(() => props.sourceY) },
  { x: computed(() => props.targetX), y: computed(() => props.targetY) },
  props.data.nodes,
  props.id
)
</script>

<template>
  <BaseEdge
    v-for="(item, index) in path[0]"
    :key="id + '-' + index"
    :id="id + '-' + index"
    :style="style"
    :path="item"
  />

  <EdgeLabelRenderer>
    <template v-if="nodes && nodes.length">
      <div
        v-for="(item, index) in nodes"
        :key="props.id + '-circle-' + index"
        class="point-box"
        :style="{
          pointerEvents: 'all',
          position: 'absolute',
          transform: `translate(-50%, -50%) translate(${item.value.x}px,${item.value.y}px)`
        }"
        @mousedown="event => onPointDown(item, event)"
      ></div>
    </template>
  </EdgeLabelRenderer>
</template>

<style>
.point-box {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: red;
}
</style>
