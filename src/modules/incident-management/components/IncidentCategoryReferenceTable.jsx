import React from "react";

export const INCIDENT_CATEGORY_DEFINITIONS = [
  {
    category: "Near Miss",
    label: "Near Miss",
    actualRating: "Not applicable",
    potentialRating: "1-5",
    description:
      "An unplanned event that did not result in injury, illness, damage to property, but had the potential to do so under slightly different circumstances."
  },
  {
    category: "No Treatment Injury",
    label: "No Treatment Injury (NTI)",
    actualRating: "1",
    potentialRating: "1-5",
    description:
      "An injury resulting in minor discomfort or superficial harm that does not require first aid or medical treatment and does not result in restricted work or lost time."
  },
  {
    category: "First Aid Injury",
    label: "First Aid Injury (FAI)",
    actualRating: "2",
    potentialRating: "2-5",
    description:
      "Minor injury requiring only basic first aid treatment and no medical intervention."
  },
  {
    category: "Medical Treatment Injury",
    label: "Medical Treatment Injury (MTI)",
    actualRating: "3",
    potentialRating: "3-5",
    description:
      "Injury requiring medical care beyond first aid but not resulting in restricted work or lost time."
  },
  {
    category: "Restricted Work Injury",
    label: "Restricted Work Injury (RWI)",
    actualRating: "3",
    potentialRating: "3-5",
    description:
      "Injury or illness that prevents full performance of normal duties but allows limited work."
  },
  {
    category: "Lost Time Injury",
    label: "Lost Time Injury (LTI)",
    actualRating: "3",
    potentialRating: "3-5",
    description:
      "Injury causing absence from work beyond the day of the incident."
  },
  {
    category: "Permanent Disability",
    label: "Permanent Disability (PD)",
    actualRating: "4",
    potentialRating: "4-5",
    description:
      "An injury or occupational illness resulting in permanent impairment, loss of bodily function, or irreversible health condition as confirmed by medical assessment."
  },
  {
    category: "Fatality",
    label: "Fatality",
    actualRating: "5",
    potentialRating: "Not applicable",
    description: "Death resulting from a work-related injury or illness."
  },
  {
    category: "Occupational Illness",
    label: "Occupational Illness (OI)",
    actualRating: "1-5",
    potentialRating: "1-5",
    description:
      "A diagnosed illness or disease caused or aggravated by workplace exposure or conditions, whether arising from a single event or cumulative exposure."
  },
  {
    category: "Environmental Incident",
    label: "Environmental Incident",
    actualRating: "1-5",
    potentialRating: "1-5",
    description:
      "Any event that has caused or has the potential to cause harm to the environment or breach of permit or legal conditions."
  },
  {
    category: "Property Damage",
    label: "Property Damage",
    actualRating: "1-5",
    potentialRating: "1-5",
    description:
      "Unplanned damage to company's, contractor's, client's, or third-party's property resulting from a work-related event."
  }
];

export const INCIDENT_CATEGORY_MAP = INCIDENT_CATEGORY_DEFINITIONS.reduce(
  (acc, item) => {
    acc[item.category] = item.description;
    return acc;
  },
  {}
);

const renderRatingBadge = (rating) => {
  if (rating === "Not applicable") {
    return (
      <span
        style={{
          display: "inline-block",
          padding: "2px 8px",
          borderRadius: "4px",
          background: "#F1F5F9",
          color: "#64748B",
          fontWeight: 600,
          fontSize: "11px"
        }}
      >
        Not applicable
      </span>
    );
  }
  if (rating === "1") {
    return (
      <span
        style={{
          display: "inline-block",
          padding: "2px 10px",
          borderRadius: "4px",
          background: "#C0C0C0",
          color: "#000000",
          fontWeight: 700,
          fontSize: "12px"
        }}
      >
        1
      </span>
    );
  }
  if (rating === "2") {
    return (
      <span
        style={{
          display: "inline-block",
          padding: "2px 10px",
          borderRadius: "4px",
          background: "#92D050",
          color: "#000000",
          fontWeight: 700,
          fontSize: "12px"
        }}
      >
        2
      </span>
    );
  }
  if (rating === "3") {
    return (
      <span
        style={{
          display: "inline-block",
          padding: "2px 10px",
          borderRadius: "4px",
          background: "#FFFF00",
          color: "#000000",
          fontWeight: 700,
          fontSize: "12px"
        }}
      >
        3
      </span>
    );
  }
  if (rating === "4") {
    return (
      <span
        style={{
          display: "inline-block",
          padding: "2px 10px",
          borderRadius: "4px",
          background: "#FF0000",
          color: "#FFFFFF",
          fontWeight: 700,
          fontSize: "12px"
        }}
      >
        4
      </span>
    );
  }
  if (rating === "5") {
    return (
      <span
        style={{
          display: "inline-block",
          padding: "2px 10px",
          borderRadius: "4px",
          background: "#C00000",
          color: "#FFFFFF",
          fontWeight: 700,
          fontSize: "12px"
        }}
      >
        5
      </span>
    );
  }
  // Range (e.g. "1-5", "2-5", "3-5", "4-5")
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: "4px",
        background: "#EFF6FF",
        border: "1px solid #BFDBFE",
        color: "#1E40AF",
        fontWeight: 700,
        fontSize: "11px"
      }}
    >
      {rating}
    </span>
  );
};

export default function IncidentCategoryReferenceTable({ onClose }) {
  return (
    <div
      style={{
        marginTop: "12px",
        marginBottom: "20px",
        background: "#ffffff",
        border: "1px solid #cbd5e1",
        borderRadius: "8px",
        boxShadow: "0 4px 14px rgba(0, 0, 0, 0.08)",
        overflow: "hidden"
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 16px",
          background: "#0b1b3d",
          color: "#ffffff"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "15px" }}>📖</span>
          <span style={{ fontWeight: 700, fontSize: "13px", color: "#ffffff" }}>
            Incident Category Classification Matrix & Definitions
          </span>
          <span style={{ fontSize: "11px", color: "#94a3b8" }}>
            (HSE Practice Standard)
          </span>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "#ffffff",
              cursor: "pointer",
              fontSize: "18px",
              lineHeight: 1,
              padding: "2px 6px",
              borderRadius: "4px"
            }}
            title="Close reference table"
            aria-label="Close"
          >
            &times;
          </button>
        )}
      </div>

      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "12px",
            lineHeight: 1.45
          }}
        >
          <thead>
            <tr style={{ background: "#0f172a", color: "#ffffff" }}>
              <th
                style={{
                  width: "24%",
                  minWidth: "160px",
                  fontWeight: 700,
                  textAlign: "left",
                  padding: "10px 12px",
                  borderRight: "1px solid #1e293b",
                  borderBottom: "1px solid #0f172a",
                  letterSpacing: "0.3px",
                  fontSize: "12px"
                }}
              >
                Category
              </th>
              <th
                style={{
                  width: "16%",
                  minWidth: "110px",
                  fontWeight: 700,
                  textAlign: "center",
                  padding: "10px 10px",
                  borderRight: "1px solid #1e293b",
                  borderBottom: "1px solid #0f172a",
                  letterSpacing: "0.3px",
                  fontSize: "12px"
                }}
              >
                Actual Severity Rating
              </th>
              <th
                style={{
                  width: "16%",
                  minWidth: "110px",
                  fontWeight: 700,
                  textAlign: "center",
                  padding: "10px 10px",
                  borderRight: "1px solid #1e293b",
                  borderBottom: "1px solid #0f172a",
                  letterSpacing: "0.3px",
                  fontSize: "12px"
                }}
              >
                Potential Severity Rating
              </th>
              <th
                style={{
                  width: "44%",
                  minWidth: "200px",
                  fontWeight: 700,
                  textAlign: "left",
                  padding: "10px 14px",
                  borderBottom: "1px solid #0f172a",
                  letterSpacing: "0.3px",
                  fontSize: "12px"
                }}
              >
                Definition & Guidance
              </th>
            </tr>
          </thead>
          <tbody>
            {INCIDENT_CATEGORY_DEFINITIONS.map((item, idx) => {
              const isEven = idx % 2 === 0;
              const rowBg = isEven ? "#f8fafc" : "#ffffff";
              return (
                <tr key={item.category}>
                  <td
                    style={{
                      background: "#0f172a",
                      color: "#ffffff",
                      fontWeight: 700,
                      textAlign: "left",
                      padding: "9px 12px",
                      borderRight: "1px solid #1e293b",
                      borderBottom: "1px solid #1e293b",
                      fontSize: "12px"
                    }}
                  >
                    {item.label}
                  </td>
                  <td
                    style={{
                      background: rowBg,
                      textAlign: "center",
                      padding: "8px 10px",
                      borderRight: "1px solid #e2e8f0",
                      borderBottom: "1px solid #e2e8f0"
                    }}
                  >
                    {renderRatingBadge(item.actualRating)}
                  </td>
                  <td
                    style={{
                      background: rowBg,
                      textAlign: "center",
                      padding: "8px 10px",
                      borderRight: "1px solid #e2e8f0",
                      borderBottom: "1px solid #e2e8f0"
                    }}
                  >
                    {renderRatingBadge(item.potentialRating)}
                  </td>
                  <td
                    style={{
                      background: rowBg,
                      color: "#1e293b",
                      padding: "8px 14px",
                      borderBottom: "1px solid #e2e8f0",
                      fontSize: "11.5px",
                      lineHeight: "1.4"
                    }}
                  >
                    {item.description}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div
        style={{
          padding: "8px 14px",
          background: "#f1f5f9",
          borderTop: "1px solid #e2e8f0",
          fontSize: "11px",
          color: "#475569",
          display: "flex",
          alignItems: "center",
          gap: "6px"
        }}
      >
        <strong style={{ color: "#0f172a" }}>Principle:</strong> Link the Category Classification to the Actual Severity rating, and then use the Actual Severity as the starting point for assessing the Potential Severity (Potential Severity ≥ Actual Severity).
      </div>
    </div>
  );
}
