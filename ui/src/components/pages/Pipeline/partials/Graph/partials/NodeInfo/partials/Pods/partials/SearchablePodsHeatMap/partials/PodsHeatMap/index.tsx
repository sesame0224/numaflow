import { useEffect, useRef, useState } from "react";
import HexagonHeatMap from "./partials/HexagonHeatMap";
import Box from "@mui/material/Box";
import {
  fill,
  imageForStatus,
} from "../../../../../../../../../../../../../utils/gradients";
import { getPodContainerUsePercentages } from "../../../../../../../../../../../../../utils";
import {
  ContainerHealth,
  Hexagon,
  PodHealth,
  PodsHeatMapProps,
} from "../../../../../../../../../../../../../types/declarations/pods";

import "./style.css";

export const PodsHeatMap = ({
  pods,
  podsDetailsMap,
  onPodClick,
  selectedPod,
}: PodsHeatMapProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [maximumWidth, setMaximumWidth] = useState<number>(0);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setMaximumWidth(containerRef.current.offsetWidth * 0.7);
      }
    };

    const resizeObserver = new ResizeObserver(updateWidth);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const cpuColors = {
    infinite: [100, 100000],
    red: [76, 1000],
    orange: [51, 75],
    yellow: [31, 50],
    green: [0, 30],
  };

  const memColors = {
    infinite: [100, 100000],
    red: [86, 1000],
    orange: [71, 85],
    yellow: [51, 70],
    green: [0, 50],
  };

  const podsHealth: PodHealth[] = [];

  if (pods && podsDetailsMap) {
    pods?.forEach((pod) => {
      if (podsDetailsMap.has(pod.name)) {
        const details = podsDetailsMap.get(pod.name);
        if (details) {
          const podObj: PodHealth = {
            name: pod.name,
            pod,
            details,
            maxCPUPerc: 0,
            maxMemPerc: 0,
            container: [],
          };
          // check if details?.containerMap is an array
          details?.containerMap &&
            details?.containerMap?.forEach((value, key) => {
              const resourceUsage = getPodContainerUsePercentages(
                pod,
                details,
                key
              );
              if (resourceUsage?.cpuPercent) {
                podObj.maxCPUPerc = Math.max(
                  podObj.maxCPUPerc,
                  resourceUsage.cpuPercent
                );
              }
              if (resourceUsage?.memoryPercent) {
                podObj.maxMemPerc = Math.max(
                  podObj.maxMemPerc,
                  resourceUsage.memoryPercent
                );
              }
              podObj.container.push({
                name: key,
                cpu: value.cpu,
                mem: value.memory,
                ...resourceUsage,
              });
            });
          podsHealth.push(podObj);
        }
      }
    });
  }

  const cpuData: Hexagon[] = [];
  const memData: Hexagon[] = [];

  podsHealth.forEach((pod) => {
    cpuData.push({
      name: pod.name,
      data: pod,
      type: "cpu",
      healthPercent: pod.maxCPUPerc,
      fill: fill(cpuColors, pod.maxCPUPerc, 1, 100),
      image: imageForStatus(cpuColors, pod.maxCPUPerc, 100),
    });
    memData.push({
      name: pod.name,
      data: pod,
      type: "mem",
      healthPercent: pod.maxMemPerc,
      fill: fill(memColors, pod.maxMemPerc, 1, 100),
      image: imageForStatus(memColors, pod.maxMemPerc, 100),
    });
  });

  const tooltipComponent = (tooltipData: Hexagon) => {
    return (
      <div>
        <div>
          <span className="hexagon-table-span">
            <b> Pod: </b>
            {tooltipData.data.name}
          </span>
        </div>
        <table className="hexagon-tooltip-table">
          <thead>
            <tr>
              <th className="hexagon-table-th">Container</th>
              <th className="hexagon-table-th">CPU</th>
              <th className="hexagon-table-th">MEM</th>
            </tr>
          </thead>
          <tbody className="hexagon-table-tbody">
            {tooltipData.data.data.container?.filter((c: any) => c?.name !== "monitor").map(
              (container: ContainerHealth) => (
                <tr style={{ textAlign: "left" }} key={container.name}>
                  <td className="hexagon-table-td">{container.name}</td>
                  <td
                    className="hexagon-table-td"
                    style={{
                      backgroundColor: fill(
                        cpuColors,
                        container.cpuPercent || -1,
                        1
                      ),
                      color: "#ffffff",
                    }}
                  >
                    {container.cpuPercent
                      ? container.cpuPercent.toFixed(2)
                      : -1}
                    %
                  </td>
                  <td
                    className="hexagon-table-td"
                    style={{
                      backgroundColor: fill(
                        memColors,
                        container.memoryPercent || -1,
                        1
                      ),
                      color: "#ffffff",
                    }}
                  >
                    {container.memoryPercent
                      ? container.memoryPercent.toFixed(2)
                      : -1}
                    %
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <Box
      sx={{
        border: "1px solid #E0E0E0",
        width: "100%",
      }}
    >
      <Box
        sx={{
          display: "flex",
          borderBottom: "1px solid #E0E0E0",
        }}
      >
        <div className="heatmap-graph-title">CPU</div>
        <div className="heatmap-graph-title">MEM</div>
      </Box>
      <Box
        sx={{
          display: "flex",
        }}
      >
        <Box ref={containerRef} sx={{ width: "50%" }}>
          <HexagonHeatMap
            data={cpuData}
            handleClick={onPodClick}
            tooltipComponent={tooltipComponent}
            tooltipClass="hexagon-tooltip"
            selected={selectedPod?.name}
            containerWidth={maximumWidth}
          />
        </Box>
        <Box sx={{ width: "50%" }}>
          <HexagonHeatMap
            data={memData}
            handleClick={onPodClick}
            tooltipComponent={tooltipComponent}
            tooltipClass="hexagon-tooltip"
            selected={selectedPod?.name}
            containerWidth={maximumWidth}
          />
        </Box>
      </Box>
    </Box>
  );
};
