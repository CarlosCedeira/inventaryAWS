import { useState, useEffect } from "react";
import { updateProduct } from "../services/productService";

export const useProductForm = (producto) => {
  const [formData, setFormData] = useState({});
  const [disabled, setDisabled] = useState(true);

  useEffect(() => {
    if (producto) setFormData(producto);
  }, [producto]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (id) => {
    const payload = {
      ...formData,
      fecha_caducidad: formData.fecha_caducidad
        ? new Date(formData.fecha_caducidad).toISOString()
        : null,
    };

    return updateProduct(id, payload);
  };

  return {
    formData,
    setFormData,
    disabled,
    setDisabled,
    handleChange,
    handleSubmit,
  };
};