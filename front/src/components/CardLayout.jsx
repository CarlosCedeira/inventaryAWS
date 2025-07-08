const CardLayout = ({ product, onClose }) => (
  <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center product-modal-backdrop">
    <div
      className="card shadow product-modal-card"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="card-body position-relative">
        <button
          className="btn btn-danger position-absolute top-0 end-0"
          onClick={onClose}
          aria-label="Cerrar"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            fill="currentColor"
            viewBox="0 0 16 16"
          >
            <path d="M2.146 2.146a.5.5 0 0 1 .708 0L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854a.5.5 0 0 1 0-.708z" />
          </svg>
        </button>
        <article>
          <header>
            <h2 className="card-title fs-3 mt-2 mb-3 text-center">
              {product.nombre}
            </h2>
          </header>

          <section className="card-text">
            <div className="container-fluid">
              <div className="row">
                <div className="col-md-6">
                  <dl>
                    <div className="row mb-2 align-items-center">
                      <dt className="col-5 text-secondary">Categoría</dt>
                      <dd className="col-7 bg-light rounded py-1 px-2 mb-0">
                        {product.id_categoria}
                      </dd>
                    </div>
                    <div className="row mb-2 align-items-center">
                      <dt className="col-5 text-secondary">Cantidad</dt>
                      <dd className="col-7 bg-light rounded py-1 px-2 mb-0">
                        {product.cantidad}
                      </dd>
                    </div>
                    <div className="row mb-2 align-items-center">
                      <dt className="col-5 text-secondary">Precio de compra</dt>
                      <dd className="col-7 bg-light rounded py-1 px-2 mb-0">
                        {product.precio_compra}
                      </dd>
                    </div>
                    <div className="row mb-2 align-items-center">
                      <dt className="col-5 text-secondary">Caducidad</dt>
                      <dd className="col-7 bg-light rounded py-1 px-2 mb-0">
                        {product.caducidad}
                      </dd>
                    </div>
                    <div className="row mb-2 align-items-center">
                      <dt className="col-5 text-secondary">Ubicación</dt>
                      <dd className="col-7 bg-light rounded py-1 px-2 mb-0">
                        {product.ubicacion}
                      </dd>
                    </div>
                  </dl>
                </div>
                <div className="col-md-6">
                  <dl>
                    <div className="row mb-2 align-items-center">
                      <dt className="col-5 text-secondary">Unidad de medida</dt>
                      <dd className="col-7 bg-light rounded py-1 px-2 mb-0">
                        {product.unidad_medida}
                      </dd>
                    </div>
                    <div className="row mb-2 align-items-center">
                      <dt className="col-5 text-secondary">
                        Cantidad de medida
                      </dt>
                      <dd className="col-7 bg-light rounded py-1 px-2 mb-0">
                        {product.cantidad_medida}
                      </dd>
                    </div>
                    <div className="row mb-2 align-items-center">
                      <dt className="col-5 text-secondary">Código de barras</dt>
                      <dd className="col-7 bg-light rounded py-1 px-2 mb-0">
                        {product.codigo_barras}
                      </dd>
                    </div>
                    <div className="row mb-2 align-items-center">
                      <dt className="col-5 text-secondary">Descripción</dt>
                      <dd className="col-7 bg-light rounded py-1 px-2 mb-0">
                        {product.descripcion}
                      </dd>
                    </div>
                  </dl>
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
