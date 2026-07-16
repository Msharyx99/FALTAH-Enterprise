import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "./config";

const equipmentCollection = collection(db, "equipment");
const categoriesCollection = collection(db, "categories");

export async function getEquipment() {
  const snapshot = await getDocs(query(equipmentCollection, orderBy("name")));

  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));
}

export async function addEquipment(equipment) {
  const docRef = await addDoc(equipmentCollection, {
    ...equipment,
    status: equipment.status || "Active",
    live: equipment.live ?? true,
    videos: Number(equipment.videos || 0),
    docs: Number(equipment.docs || 0),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
}

export async function updateEquipment(id, equipment) {
  await updateDoc(doc(db, "equipment", id), {
    ...equipment,
    videos: Number(equipment.videos || 0),
    docs: Number(equipment.docs || 0),
    updatedAt: serverTimestamp(),
  });
}

export async function deleteEquipment(id) {
  await deleteDoc(doc(db, "equipment", id));
}


export async function getCategories() {
  const snapshot = await getDocs(categoriesCollection);

  return snapshot.docs
    .map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }))
    .sort((a, b) => {
      const ao = Number(a.order ?? 9999);
      const bo = Number(b.order ?? 9999);
      if (ao !== bo) return ao - bo;
      return String(a.name || a.label || "").localeCompare(String(b.name || b.label || ""));
    });
}

export async function addCategory(category) {
  const docRef = await addDoc(categoriesCollection, {
    ...category,
    name: category.name || category.label || "Untitled Category",
    label: category.label || category.name || "Untitled Category",
    description: category.description || "",
    color: category.color || "#D4AF37",
    live: category.live ?? true,
    status: category.live === false ? "Inactive" : "Active",
    count: Number(category.count || 0),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
}

export async function updateCategory(id, category) {
  await updateDoc(doc(db, "categories", id), {
    ...category,
    name: category.name || category.label || "Untitled Category",
    label: category.label || category.name || "Untitled Category",
    description: category.description || "",
    color: category.color || "#D4AF37",
    live: category.live ?? true,
    status: category.live === false ? "Inactive" : "Active",
    count: Number(category.count || 0),
    updatedAt: serverTimestamp(),
  });
}

export async function deleteCategory(id) {
  await deleteDoc(doc(db, "categories", id));
}


export async function getCmsItems(collectionName) {
  const snapshot = await getDocs(collection(db, collectionName));
  return snapshot.docs
    .map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }))
    .sort((a, b) => {
      const ao = Number(a.order ?? 9999);
      const bo = Number(b.order ?? 9999);
      if (ao !== bo) return ao - bo;
      return String(a.name || a.label || a.title || "").localeCompare(String(b.name || b.label || b.title || ""));
    });
}

export async function getCmsDocument(collectionName, documentId = "main") {
  const ref = doc(db, collectionName, documentId);
  const snap = await getDoc(ref);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function setCmsDocument(collectionName, documentId = "main", item = {}) {
  const ref = doc(db, collectionName, documentId);
  await setDoc(ref, {
    ...item,
    live: item.live ?? true,
    updatedAt: serverTimestamp(),
  }, { merge: true });
  return documentId;
}

export async function addCmsItem(collectionName, item) {
  const docRef = await addDoc(collection(db, collectionName), {
    ...item,
    live: item.live ?? true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateCmsItem(collectionName, id, item) {
  await updateDoc(doc(db, collectionName, id), {
    ...item,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteCmsItem(collectionName, id) {
  await deleteDoc(doc(db, collectionName, id));
}
