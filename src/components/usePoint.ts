import { getStraightPath, useEdge, useVueFlow } from "@vue-flow/core";
import { onMounted, onUnmounted, ref, watch, type Ref } from 'vue';

// 计算点是否在直线上
function isPointOnLine(x1: number, y1: number, x2: number, y2: number, px: number, py: number) {
  // 计算线段的长度
  const lineLength = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

  // 如果线段长度为0，即两个端点重合，则点必须与端点重合
  if (lineLength === 0) {
    return px === x1 && py === y1;
  }

  // 计算点到线段的投影点
  const dot = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / lineLength ** 2;
  const closestX = x1 + dot * (x2 - x1);
  const closestY = y1 + dot * (y2 - y1);

  // 计算点到投影点的距离
  const distanceToLine = Math.sqrt((px - closestX) ** 2 + (py - closestY) ** 2);

  // 如果距离为0，则点在线段上
  return Math.abs(distanceToLine) < 5;
}

// 自定义节流函数
function throttle(fn: (args: MouseEvent) => void, delay: number) {
  let lastTime = 0;
  return function (this: unknown, args: MouseEvent) {
    const now = Date.now();
    if (now - lastTime >= delay) {
      fn.call(this, args);
      lastTime = now;
    }
  };
}

type Point = {
  x: number,
  y: number
}
type PointRef = { x: Ref<number>, y: Ref<number> }

const usePoint = (begin: PointRef, end: PointRef, defaultNodes: Point[], id: string) => {
  const isDown = ref(false)
  const { screenToFlowCoordinate } = useVueFlow();
  const nodes = ref<Ref<Point>[]>([]);
  const path = ref<[string[], number, number]>([
    [], 0, 0
  ]);
  let activeNode = ref<null | Point>(null);
  const timer = ref<null | number>(null);

  if (defaultNodes && defaultNodes.length) {
    nodes.value = defaultNodes.map(item => {
      return ref({
        x: item.x,
        y: item.y,
      });
    });
  }

  const freshPath = () => {
    path.value[0] = [];

    const newNodes = [
      { x: begin.x.value, y: begin.y.value },
      ...nodes.value.map(item => item.value),
      { x: end.x.value, y: end.y.value },
    ];

    for (let i = 0; i < newNodes.length - 1; i++) {
      const newPath = getStraightPath({
        sourceX: newNodes[i].x,
        sourceY: newNodes[i].y,
        targetX: newNodes[i + 1].x,
        targetY: newNodes[i + 1].y,
      });
      path.value[0].push(newPath[0]);
      path.value[1] = newPath[1];
      path.value[2] = newPath[2];
    }
  }

  watch(
    () => begin,
    () => {
      freshPath();
    },
    {
      deep: true,
      immediate: true,
    }
  );

  watch(
    () => end,
    () => {
      freshPath();
    },
    {
      deep: true,
      immediate: true,
    }
  );

  const onMouseDown = (event: MouseEvent) => {
    if (isDown.value) return
    if (timer.value) {
      clearTimeout(timer.value)
    }
    timer.value = setTimeout(() => {
      event.preventDefault();
      event.stopPropagation();
      isDown.value = true;
      const position = screenToFlowCoordinate({
        x: event.clientX,
        y: event.clientY,
      });
      const newNode = ref({
        x: position.x,
        y: position.y,
      });
      // 判断点位在哪条线上
      const nodeArr = [
        { x: begin.x.value, y: begin.y.value },
        ...nodes.value.map(item => item.value),
        { x: end.x.value, y: end.y.value },
      ];
      let index = -1;
      for (let i = 0; i < nodeArr.length - 1; ++i) {
        if (
          isPointOnLine(
            nodeArr[i].x,
            nodeArr[i].y,
            nodeArr[i + 1].x,
            nodeArr[i + 1].y,
            position.x,
            position.y
          )
        ) {
          index = i;
          break;
        }
      }
      if (index !== -1) {
        nodes.value.splice(index, 0, newNode);
        activeNode = newNode;
      }
    }, 200)
  }

  const onMouseMove = throttle((event: MouseEvent) => {
    if (isDown.value && nodes.value.length) {
      const position = screenToFlowCoordinate({
        x: event.clientX,
        y: event.clientY,
      });
      if (activeNode.value) {
        activeNode.value.x = position.x;
        activeNode.value.y = position.y;
      }
      freshPath();
    }
  }, 16);


  const onMouseUp = () => {
    isDown.value = false;
    if (timer.value) {
      clearTimeout(timer.value);
    }
  };

  const onPointDown = (node: Ref<Point>, event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    activeNode = node;
    isDown.value = true;
  };

  type EdgeData = {
    nodes: Point[];
  };

  let edge: ReturnType<typeof useEdge> & { edge: { data: EdgeData } };

  watch(
    nodes,
    newNodes => {
      if (!edge) {
        return;
      }
      edge.edge.data.nodes = newNodes.map(item => {
        return {
          ...item.value,
        };
      });
    },
    {
      deep: true,
      immediate: true,
    }
  );

  onMounted(() => {
    edge = useEdge(id) as ReturnType<typeof useEdge> & { edge: { data: EdgeData } };
    const edgeEl = edge.edgeEl.value;
    if (edgeEl) {
      edgeEl.addEventListener('mousedown', onMouseDown);
      edgeEl.addEventListener('mouseup', onMouseUp);
    }
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  });

  onUnmounted(() => {
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
  });

  return {
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onPointDown,
    path,
    nodes,
  }
}
export default usePoint
