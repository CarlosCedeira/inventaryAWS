import "./cardLayout.css";

const CardLayout = ({ product, onClose }) => (
  <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center product-modal-backdrop">
    <div
      className="card shadow product-modal-card"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="card-body position-relative ">
        <article className="modal-content ">
          <button
            type="button"
            className="btn-close position-absolute top-0 end-0 "
            onClick={onClose}
          ></button>
          <header className="modal-header">
            <h2 className="card-title fs-3 mt-2 mb-3 text-center w-100">
              {product.nombre}
            </h2>
          </header>
          {/* Descripción y otros datos */}

          <div className="row mt-3"></div>

          <section className="card-text">
            <div className="container-fluid">
              <fieldset className="border rounded p-3 h-100">
                <div className="col-md-6 mb-4">
                  <strong>Descripción:</strong>{" "}
                  <span className=" rounded py-1 px-2 text-nowrap">
                    {product.descripcion}
                  </span>
                </div>
                <div className="row">
                  {/* Columna 1 */}
                  <div className="col-md-6">
                    <legend className="fs-6 mb-3">Inventario</legend>
                    <dl>
                      <div className="row mb-2 align-items-center">
                        <dt className="col-6 text-secondary">Cantidad</dt>
                        <dd className="col-6  rounded py-1 px-2 mb-0">
                          {product.cantidad}
                        </dd>
                      </div>
                      <div className="row mb-2 align-items-center">
                        <dt className="col-6 text-secondary">
                          Precio de compra
                        </dt>
                        <dd className="col-6  rounded py-1 px-2 mb-0">
                          {product.precio_compra}
                        </dd>
                      </div>
                      <div className="row mb-2 align-items-center">
                        <dt className="col-6 text-secondary">
                          Precio de venta
                        </dt>
                        <dd className="col-6  rounded py-1 px-2 mb-0">
                          {product.precio_venta}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  {/* Columna 2 */}

                  <div className="col-md-6">
                    <legend className="fs-6 mb-3">Detalles</legend>
                    <dl>
                      <div className="row mb-2 align-items-center">
                        <dt className="col-6 text-secondary">Caducidad</dt>
                        <dd className="col-6  rounded py-1 px-2 mb-0">
                          {product.caducidad}
                        </dd>
                      </div>
                      <div className="row mb-2 align-items-center">
                        <dt className="col-6 text-secondary">Publicado</dt>
                        <dd className="col-6  rounded py-1 px-2 mb-0">
                          {product.publicado ? "Sí" : "No"}
                        </dd>
                      </div>
                      <div className="row mb-2 align-items-center">
                        <dt className="col-6 text-secondary">
                          Fecha de creacion
                        </dt>
                        <dd className="col-6  rounded py-1 px-2 mb-0">
                          {product.fecha_creacion}
                        </dd>
                      </div>

                      <div className="row mb-2 align-items-center">
                        <dt className="col-6 text-secondary">
                          Código de barras
                        </dt>
                        <dd className="col-6  rounded py-1 px-2 mb-0">
                          {product.codigo_barras}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </fieldset>
            </div>
          </section>
        </article>
      </div>
    </div>
  </div>
);

export default CardLayout;
