import React, { FC } from "react";
import Panel from "./Panel";
import { BsCalendar } from "react-icons/bs";
import styles from "./YearFilter.module.css";
import { useSigma } from "react-sigma-v2";

interface YearFilterProps {
  selectedYears: string[];
  setSelectedYears: (years: string[]) => void;
}

const YearFilter: FC<YearFilterProps> = ({ selectedYears, setSelectedYears }) => {
  const sigma = useSigma();
  const graph = sigma.getGraph();
  const years = ["2024", "2023", "2022", "2021"];

  // Check if any nodes have year attributes
  const hasYearAttributes = years.some(year => {
    let foundYear = false;
    graph.forEachNode((node) => {
      if (graph.hasNodeAttribute(node, year)) {
        foundYear = true;
        return false; // break the loop
      }
    });
    return foundYear;
  });

  // If no year attributes found, don't render the component
  if (!hasYearAttributes) {
    return null;
  }

  const handleYearToggle = (year: string) => {
    if (selectedYears.includes(year)) {
      setSelectedYears(selectedYears.filter(y => y !== year));
    } else {
      setSelectedYears([...selectedYears, year]);
    }
  };

  const handleToggleAll = () => {
    if (selectedYears.length === years.length) {
      setSelectedYears([]);  // Uncheck all
    } else {
      setSelectedYears([...years]);  // Check all
    }
  };

  return (
    <Panel
      title={
        <>
          <BsCalendar className="text-muted" /> Year Filter
        </>
      }
    >
      <div className={styles.yearFilterContainer}>
        <button 
          onClick={handleToggleAll}
          className={styles.toggleAllButton}
        >
          {selectedYears.length === years.length ? 'Uncheck All' : 'Check All'}
        </button>
        <div className={styles.checkboxContainer}>
          {years.map(year => (
            <label key={year} className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={selectedYears.includes(year)}
                onChange={() => handleYearToggle(year)}
                className={styles.checkbox}
              />
              <span>{year}</span>
            </label>
          ))}
        </div>
      </div>
    </Panel>
  );
};

export default YearFilter; 