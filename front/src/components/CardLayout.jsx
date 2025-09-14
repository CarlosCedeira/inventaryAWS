const CardLayout = ({ product, onClose }) => (
  <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center product-modal-backdrop">
    <div
      className="card shadow product-modal-card"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="card-body position-relative">
        <article className="modal-content">
          <header className="modal-header">
            <h2 className="card-title fs-3 mt-2 mb-3 text-center w-100">
              {product.nombre}
            </h2>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
            ></button>
          </header>

          <section className="card-text">
            <div className="container-fluid">
              <fieldset className="border rounded p-3 h-100">
                <div className="row">
                  {/* Columna 1 */}
                  <div className="col-md-6">
                    <legend className="fs-6 mb-3">Inventario</legend>
                    <dl>
                      <div className="row mb-2 align-items-center">
                        <div className="row mb-2 align-items-center">
                          <dt className="col-6 text-secondary">Cantidad</dt>
                          <dd className="col-6 bg-light rounded py-1 px-2 mb-0">
                            {product.cantidad}
                          </dd>
                        </div>
                        <dt className="col-6 text-secondary text-nowrap">
                          Precio de compra
                        </dt>
                        <dd className="col-6 bg-light rounded py-1 px-2 mb-0">
                          {product.precio_compra}
                        </dd>
                      </div>
                      <div className="row mb-2 align-items-center">
                        <dt className="col-6 text-secondary"> Ubicación</dt>
                        <dd className="col-6 bg-light rounded py-1 px-2 mb-0">
                          {product.ubicacion}
                        </dd>
                      </div>
                      <div className="row mb-2 align-items-center">
                        <dt className="col-6 text-secondary">Caducidad</dt>
                        <dd className="col-6 bg-light rounded py-1 px-2 mb-0">
                          {product.caducidad}
                        </dd>
                      </div>
                    </dl>
                  </div>
                  {/* Columna 2 */}
                  <div className="col-md-6">
                    <legend className="fs-6 mb-3">Detalles</legend>
                    <dl>
                      <div className="row mb-2 align-items-center">
                        <dt className="col-6 text-secondary text-nowrap">
                          Unidad de medida
                        </dt>
                        <dd className="col-6 bg-light rounded py-1 px-2 mb-0">
                          {product.unidad_medida}
                        </dd>
                      </div>
                      <div className="row mb-2 align-items-center">
                        <dt className="col-6 text-secondary text-nowrap">
                          Cantidad de medida
                        </dt>
                        <dd className="col-6 bg-light rounded py-1 px-2 mb-0">
                          {product.cantidad_medida}
                        </dd>
                      </div>
                      <div className="row mb-2 align-items-center">
                        <dt className="col-6 text-secondary">
                          Código de barras
                        </dt>
                        <dd className="col-6 bg-light rounded py-1 px-2 mb-0">
                          {product.codigo_barras}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </fieldset>
              {/* Descripción y otros datos */}
              <div className="row mt-3">
                <div className="col-md-6 mb-2">
                  <strong>Descripción:</strong>{" "}
                  <span className="bg-light rounded py-1 px-2 text-nowrap">
                    {product.descripcion}
                  </span>
                </div>
              </div>
            </div>
          </section>
        </article>
      </div>
    </div>
  </div>
);

export default CardLayout;
