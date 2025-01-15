import React, { FC } from "react";
import Panel from "./Panel";
import { BsCalendar } from "react-icons/bs";
import { AiOutlineCloseCircle } from "react-icons/ai";
import styles from "./YearFilter.module.css";

interface YearFilterProps {
  selectedYears: string[];
  setSelectedYears: (years: string[]) => void;
}

const YearFilter: FC<YearFilterProps> = ({ selectedYears, setSelectedYears }) => {
  const years = ["2024", "2023", "2022", "2021"];

  const handleYearToggle = (year: string) => {
    if (selectedYears.includes(year)) {
      setSelectedYears(selectedYears.filter(y => y !== year));
    } else {
      setSelectedYears([...selectedYears, year]);
    }
  };

  const handleToggleAll = () => {
    if (selectedYears.length === years.length) {
      setSelectedYears([]);
    } else {
      setSelectedYears([...years]);
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
        <div className={styles.buttonContainer}>
          <button 
            className="btn btn-sm btn-link text-muted" 
            onClick={() => setSelectedYears([...years])}
          >
            <AiOutlineCloseCircle /> Check all
          </button>
          <button 
            className="btn btn-sm btn-link text-muted" 
            onClick={() => setSelectedYears([])}
          >
            <AiOutlineCloseCircle /> Uncheck all
          </button>
        </div>
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
    </Panel>
  );
};

export default YearFilter; 