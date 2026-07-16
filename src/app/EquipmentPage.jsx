import React, { useEffect, useState } from "react";
import { getEquipment } from "../firebase/firestoreService";

export default function EquipmentPage() {
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEquipment() {
      try {
        const data = await getEquipment();
        setEquipment(data);
      } catch (error) {
        console.error("Error loading equipment:", error);
      } finally {
        setLoading(false);
      }
    }

    loadEquipment();
  }, []);

  if (loading) {
    return <h2>Loading equipment...</h2>;
  }

  return (
    <div style={{ padding: "30px" }}>
      <h1>Equipment Library</h1>

      {equipment.map((item) => (
        <div
          key={item.id}
          style={{
            border: "1px solid #ddd",
            padding: "16px",
            borderRadius: "12px",
            marginBottom: "12px",
          }}
        >
          <h2>{item.name}</h2>
          <p><b>Category:</b> {item.category}</p>
          <p>{item.description}</p>
          <p><b>Status:</b> {item.status}</p>
          <p><b>Icon:</b> {item.icon}</p>
        </div>
      ))}
    </div>
  );
}
