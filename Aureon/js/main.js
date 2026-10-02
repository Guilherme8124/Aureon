(() => {
  "use strict";

  /* =========================================================
     AUREON — MAIN.JS
     Frontend principal da plataforma Aureon
  ========================================================= */

  /* =========================================================
     HELPERS
  ========================================================= */

  const $ = (selector, scope = document) =>
    scope.querySelector(selector);

  const $$ = (selector, scope = document) =>
    [...scope.querySelectorAll(selector)];

  const root = document.documentElement;

  const CONFIG = window.AUREON_CONFIG || {};

  const SUPABASE_URL =
    CONFIG.SUPABASE_URL || "";

  const SUPABASE_ANON_KEY =
    CONFIG.SUPABASE_ANON_KEY || "";

  let supabase = null;

  if (
    SUPABASE_URL &&
    SUPABASE_ANON_KEY &&
    window.supabase
  ) {
    try {
      supabase = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
      );
    } catch (error) {
      console.error(
        "[Aureon] Erro ao inicializar Supabase:",
        error
      );
    }
  }

  /* =========================================================
     CONFIGURAÇÕES
  ========================================================= */

  const WA_NUMBER = "5599984883104";
  const WA_BASE = `https://wa.me/${WA_NUMBER}`;

  let currentArticleId = null;

  /* =========================================================
     LOADER
  ========================================================= */

  window.addEventListener("load", () => {
    setTimeout(() => {
      const loader = $("#loader");

      if (loader) {
        loader.classList.add("done");
      }
    }, 900);
  });

  /* =========================================================
     TEMA
  ========================================================= */

  const themeButton = $("#theme");

  function updateThemeButton() {
    if (!themeButton) return;

    const dark =
      root.dataset.theme === "dark";

    themeButton.textContent =
      dark ? "🌙" : "☀️";

    themeButton.setAttribute(
      "aria-label",
      dark
        ? "Ativar modo claro"
        : "Ativar modo escuro"
    );

    themeButton.setAttribute(
      "title",
      dark
        ? "Ativar modo claro"
        : "Ativar modo escuro"
    );
  }

  updateThemeButton();

  themeButton?.addEventListener(
    "click",
    () => {
      const newTheme =
        root.dataset.theme === "dark"
          ? "light"
          : "dark";

      root.dataset.theme = newTheme;

      try {
        localStorage.setItem(
          "aureon-theme",
          newTheme
        );
      } catch {}

      updateThemeButton();
    }
  );

  /* =========================================================
     MENU MOBILE
  ========================================================= */

  const menu = $("#menu");
  const burger = $("#burger");

  burger?.addEventListener(
    "click",
    () => {
      if (!menu) return;

      const opened =
        menu.classList.toggle("open");

      burger.setAttribute(
        "aria-expanded",
        String(opened)
      );
    }
  );

  menu?.addEventListener(
    "click",
    event => {
      if (
        event.target instanceof
        HTMLAnchorElement
      ) {
        menu.classList.remove("open");

        burger?.setAttribute(
          "aria-expanded",
          "false"
        );
      }
    }
  );

  /* =========================================================
     HEADER / VOLTAR AO TOPO
  ========================================================= */

  const nav = $("#nav");
  const topButton = $("#top");

  window.addEventListener(
    "scroll",
    () => {
      nav?.classList.toggle(
        "scrolled",
        window.scrollY > 30
      );

      topButton?.classList.toggle(
        "show",
        window.scrollY > 500
      );
    },
    {
      passive: true
    }
  );

  topButton?.addEventListener(
    "click",
    () => {
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    }
  );

  /* =========================================================
     NAVEGAÇÃO ATIVA
  ========================================================= */

  const menuLinks = $$("#menu a");

  const sections = [
    "inicio",
    "sobre",
    "servicos",
    "processo",
    "aureon-ai",
    "biblioteca",
    "calculadoras",
    "investir",
    "projetos",
    "novidades",
    "diferenciais",
    "criador",
    "contato"
  ]
    .map(id => $("#" + id))
    .filter(Boolean);

  if (
    "IntersectionObserver" in window &&
    sections.length
  ) {
    const sectionObserver =
      new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            if (!entry.isIntersecting) {
              return;
            }

            menuLinks.forEach(link => {
              link.classList.toggle(
                "active",
                link.getAttribute("href") ===
                  `#${entry.target.id}`
              );
            });
          });
        },
        {
          rootMargin:
            "-40% 0px -50% 0px"
        }
      );

    sections.forEach(section =>
      sectionObserver.observe(section)
    );
  }

  /* =========================================================
     REVEAL ANIMATION
  ========================================================= */

  const revealElements =
    $$(".reveal");

  if (
    "IntersectionObserver" in window
  ) {
    const revealObserver =
      new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            if (!entry.isIntersecting) {
              return;
            }

            entry.target.classList.add("in");

            revealObserver.unobserve(
              entry.target
            );
          });
        },
        {
          threshold: 0.12
        }
      );

    revealElements.forEach(element =>
      revealObserver.observe(element)
    );
  } else {
    revealElements.forEach(element =>
      element.classList.add("in")
    );
  }

  /* =========================================================
     PARTICULAS / BACKGROUND INTERATIVO
  ========================================================= */

  const canvas = $("#bg");

  if (canvas) {
    const context =
      canvas.getContext("2d");

    let width = 0;
    let height = 0;
    let particles = [];

    const reducedMotion =
      window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

    const pointer = {
      x: -9999,
      y: -9999,
      active: false
    };

    const PARTICLE_DISTANCE = 120;
    const MOUSE_RADIUS = 170;

    function resizeCanvas() {
      const rect =
        canvas.getBoundingClientRect();

      width =
        canvas.width =
          Math.max(1, Math.floor(rect.width));

      height =
        canvas.height =
          Math.max(1, Math.floor(rect.height));

      const amount = Math.min(
        70,
        Math.max(
          22,
          Math.floor(width / 24)
        )
      );

      particles =
        Array.from(
          {
            length: amount
          },
          () => ({
            x:
              Math.random() *
              width,

            y:
              Math.random() *
              height,

            vx:
              (Math.random() - 0.5) *
              0.35,

            vy:
              (Math.random() - 0.5) *
              0.35,

            size:
              Math.random() *
                1.5 +
              0.7
          })
        );
    }

    resizeCanvas();

    window.addEventListener(
      "resize",
      resizeCanvas,
      {
        passive: true
      }
    );

    function updatePointer(event) {
      const rect =
        canvas.getBoundingClientRect();

      pointer.x =
        event.clientX -
        rect.left;

      pointer.y =
        event.clientY -
        rect.top;

      pointer.active =
        pointer.x >= 0 &&
        pointer.x <= width &&
        pointer.y >= 0 &&
        pointer.y <= height;
    }

    window.addEventListener(
      "pointermove",
      updatePointer,
      {
        passive: true
      }
    );

    window.addEventListener(
      "pointerleave",
      () => {
        pointer.active = false;
      },
      {
        passive: true
      }
    );

    let canvasVisible = true;

    if (
      "IntersectionObserver" in window
    ) {
      new IntersectionObserver(
        entries => {
          canvasVisible =
            entries[0]?.isIntersecting ??
            true;
        }
      ).observe(canvas);
    }

    function drawParticles() {
      if (
        canvasVisible &&
        context
      ) {
        context.clearRect(
          0,
          0,
          width,
          height
        );

        particles.forEach(
          (particle, index) => {
            particle.x +=
              particle.vx;

            particle.y +=
              particle.vy;

            if (
              pointer.active &&
              !reducedMotion
            ) {
              const dx =
                particle.x -
                pointer.x;

              const dy =
                particle.y -
                pointer.y;

              const distance =
                Math.hypot(
                  dx,
                  dy
                );

              if (
                distance <
                  MOUSE_RADIUS &&
                distance > 0
              ) {
                const force =
                  (1 -
                    distance /
                      MOUSE_RADIUS) *
                  0.035;

                particle.vx +=
                  (dx / distance) *
                  force;

                particle.vy +=
                  (dy / distance) *
                  force;
              }
            }

            particle.vx =
              Math.max(
                -0.8,
                Math.min(
                  0.8,
                  particle.vx
                )
              );

            particle.vy =
              Math.max(
                -0.8,
                Math.min(
                  0.8,
                  particle.vy
                )
              );

            particle.vx *=
              0.995;

            particle.vy *=
              0.995;

            if (
              Math.abs(
                particle.vx
              ) < 0.04
            ) {
              particle.vx +=
                (Math.random() -
                  0.5) *
                0.015;
            }

            if (
              Math.abs(
                particle.vy
              ) < 0.04
            ) {
              particle.vy +=
                (Math.random() -
                  0.5) *
                0.015;
            }

            if (
              particle.x < 0
            ) {
              particle.x =
                width;
            }

            if (
              particle.x > width
            ) {
              particle.x =
                0;
            }

            if (
              particle.y < 0
            ) {
              particle.y =
                height;
            }

            if (
              particle.y > height
            ) {
              particle.y =
                0;
            }

            context.beginPath();

            context.fillStyle =
              "rgba(212,168,75,.82)";

            context.arc(
              particle.x,
              particle.y,
              particle.size,
              0,
              Math.PI * 2
            );

            context.fill();

            for (
              let j =
                index + 1;
              j <
              particles.length;
              j++
            ) {
              const other =
                particles[j];

              const distance =
                Math.hypot(
                  particle.x -
                    other.x,
                  particle.y -
                    other.y
                );

              if (
                distance <
                PARTICLE_DISTANCE
              ) {
                const opacity =
                  0.16 *
                  (
                    1 -
                    distance /
                      PARTICLE_DISTANCE
                  );

                context.strokeStyle =
                  `rgba(212,168,75,${opacity})`;

                context.lineWidth =
                  0.7;

                context.beginPath();

                context.moveTo(
                  particle.x,
                  particle.y
                );

                context.lineTo(
                  other.x,
                  other.y
                );

                context.stroke();
              }
            }

            if (
              pointer.active &&
              !reducedMotion
            ) {
              const distance =
                Math.hypot(
                  particle.x -
                    pointer.x,
                  particle.y -
                    pointer.y
                );

              if (
                distance <
                MOUSE_RADIUS
              ) {
                const opacity =
                  0.25 *
                  (
                    1 -
                    distance /
                      MOUSE_RADIUS
                  );

                context.strokeStyle =
                  `rgba(212,168,75,${opacity})`;

                context.lineWidth =
                  0.8;

                context.beginPath();

                context.moveTo(
                  particle.x,
                  particle.y
                );

                context.lineTo(
                  pointer.x,
                  pointer.y
                );

                context.stroke();
              }
            }
          }
        );
      }

      if (!reducedMotion) {
        requestAnimationFrame(
          drawParticles
        );
      }
    }

    drawParticles();
  }

  /* =========================================================
     TOAST
  ========================================================= */

  function toast(
    message,
    type = "info"
  ) {
    const container =
      $("#toast-container");

    if (!container) return;

    const item =
      document.createElement("div");

    item.className =
      `toast toast-${type}`;

    item.setAttribute(
      "role",
      "status"
    );

    item.textContent =
      message;

    container.appendChild(item);

    requestAnimationFrame(() => {
      item.classList.add("show");
    });

    setTimeout(() => {
      item.classList.remove("show");

      setTimeout(
        () => item.remove(),
        300
      );
    }, 3500);
  }

  /* =========================================================
     ESCAPE HTML
  ========================================================= */

  function escapeHTML(value) {
    return String(value ?? "")
      .replaceAll(
        "&",
        "&amp;"
      )
      .replaceAll(
        "<",
        "&lt;"
      )
      .replaceAll(
        ">",
        "&gt;"
      )
      .replaceAll(
        '"',
        "&quot;"
      )
      .replaceAll(
        "'",
        "&#039;"
      );
  }

  /* =========================================================
     ESTADOS DE CONTEÚDO
  ========================================================= */

  function showLoading(
    element,
    message = "Carregando..."
  ) {
    if (!element) return;

    element.innerHTML = `
      <article class="card loading-card">
        <span class="ic">◌</span>
        <h3>${escapeHTML(message)}</h3>
        <p>Aguarde enquanto carregamos o conteúdo.</p>
      </article>
    `;
  }

  function showDataError(
    element,
    message =
      "Não foi possível carregar este conteúdo."
  ) {
    if (!element) return;

    element.innerHTML = `
      <article class="card empty-state data-error">
        <span class="ic">⚠️</span>
        <h3>Conteúdo temporariamente indisponível</h3>
        <p>${escapeHTML(message)}</p>

        <button
          class="btn"
          type="button"
          data-retry-content
        >
          Tentar novamente
        </button>
      </article>
    `;
  }

  /* =========================================================
     STATUS DE ATENDIMENTO
     
     Valores permitidos no banco:
       available
       busy
       offline

     IMPORTANTE:
     Erro, valor vazio ou valor inválido
     NÃO será convertido em offline.
  ========================================================= */

  const VALID_SERVICE_STATUSES = [
    "available",
    "busy",
    "offline"
  ];

  const SERVICE_STATUS_CONFIG = {
    available: {
      label: "Disponível",

      description:
        "A Aureon está disponível para atendimento.",

      className:
        "status-available"
    },

    busy: {
      label:
        "Em atendimento",

      description:
        "A Aureon está atendendo no momento.",

      className:
        "status-busy"
    },

    offline: {
      label:
        "Indisponível",

      description:
        "A Aureon não está disponível para atendimento no momento.",

      className:
        "status-offline"
    }
  };

  let lastConfirmedServiceStatus =
    null;

  let serviceStatusLoading =
    false;

  function isValidServiceStatus(
    value
  ) {
    return VALID_SERVICE_STATUSES.includes(
      value
    );
  }

  function normalizeServiceStatus(
    value
  ) {
    const status =
      String(value ?? "")
        .trim()
        .toLowerCase();

    return isValidServiceStatus(
      status
    )
      ? status
      : null;
  }

  function setServiceStatusLoading() {
    const element =
      $("#service-status");

    if (!element) return;

    element.classList.remove(
      "status-available",
      "status-busy",
      "status-offline",
      "status-error"
    );

    element.classList.add(
      "loading"
    );

    element.dataset.status =
      "loading";

    const title =
      $("#service-status-title");

    const message =
      $("#service-status-message");

    if (title) {
      title.textContent =
        "Verificando atendimento...";
    }

    if (message) {
      message.textContent =
        "Consultando disponibilidade da equipe.";
    }

    element.removeAttribute(
      "title"
    );

    element.setAttribute(
      "aria-label",
      "Verificando status de atendimento"
    );
  }

  function setServiceStatusError(
    message =
      "Não foi possível verificar a disponibilidade da equipe."
  ) {
    const element =
      $("#service-status");

    if (!element) return;

    element.classList.remove(
      "loading",
      "status-available",
      "status-busy",
      "status-offline"
    );

    element.classList.add(
      "status-error"
    );

    element.dataset.status =
      "error";

    const title =
      $("#service-status-title");

    const messageElement =
      $("#service-status-message");

    if (title) {
      title.textContent =
        "Status indisponível";
    }

    if (messageElement) {
      messageElement.textContent =
        message;
    }

    element.setAttribute(
      "aria-label",
      "Não foi possível verificar o status de atendimento"
    );

    element.setAttribute(
      "title",
      message
    );
  }

  function updateServiceStatusUI(
    serviceStatus
  ) {
    const statusElement =
      $("#service-status");

    if (!statusElement) {
      return false;
    }

    const normalizedStatus =
      normalizeServiceStatus(
        serviceStatus
      );

    /*
     * Nunca transforma valor inválido
     * em offline.
     */
    if (
      !normalizedStatus
    ) {
      setServiceStatusError(
        "O sistema retornou um status de atendimento inválido."
      );

      return false;
    }

    const config =
      SERVICE_STATUS_CONFIG[
        normalizedStatus
      ];

    statusElement.classList.remove(
      "loading",
      "status-error",
      "status-available",
      "status-busy",
      "status-offline"
    );

    statusElement.classList.add(
      config.className
    );

    statusElement.dataset.status =
      normalizedStatus;

    const title =
      $("#service-status-title");

    const message =
      $("#service-status-message");

    if (title) {
      title.textContent =
        config.label;
    }

    if (message) {
      message.textContent =
        config.description;
    }

    /*
     * Compatibilidade com HTML antigo.
     */
    if (
      !title &&
      !message
    ) {
      statusElement.innerHTML = `
        <span
          class="status-dot ${config.className}"
          aria-hidden="true"
        ></span>

        <span>
          ${escapeHTML(
            config.label
          )}
        </span>
      `;
    }

    statusElement.setAttribute(
      "aria-label",
      `Status de atendimento: ${config.label}`
    );

    statusElement.setAttribute(
      "title",
      config.description
    );

    return true;
  }

  async function loadServiceStatus() {
    const statusElement =
      $("#service-status");

    if (!statusElement) {
      return;
    }

    /*
     * Evita duas consultas simultâneas.
     */
    if (
      serviceStatusLoading
    ) {
      return;
    }

    serviceStatusLoading =
      true;

    setServiceStatusLoading();

    /*
     * Se o Supabase não existe,
     * não podemos afirmar nenhum estado.
     */
    if (!supabase) {
      setServiceStatusError(
        "Não foi possível conectar ao sistema de atendimento."
      );

      console.warn(
        "[Aureon] Supabase não inicializado."
      );

      serviceStatusLoading =
        false;

      return;
    }

    try {
      const {
        data,
        error
      } = await supabase
        .from("site_settings")
        .select(
          "service_status"
        )
        .eq(
          "id",
          1
        )
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error(
          "Configuração de atendimento não encontrada."
        );
      }

      const status =
        normalizeServiceStatus(
          data.service_status
        );

      /*
       * Valor inválido não pode
       * ser tratado como status real.
       */
      if (!status) {
        throw new Error(
          "Status de atendimento inválido."
        );
      }

      const updated =
        updateServiceStatusUI(
          status
        );

      if (!updated) {
        throw new Error(
          "Não foi possível atualizar a interface do status."
        );
      }

      /*
       * Só salvamos como confirmado
       * depois de validar o retorno.
       */
      lastConfirmedServiceStatus =
        status;

      console.log(
        "[Aureon] Status confirmado:",
        status
      );

    } catch (error) {
      console.error(
        "[Aureon] Erro ao carregar status:",
        error
      );

      /*
       * NÃO usamos offline aqui.
       * O último status confirmado permanece
       * apenas como referência interna.
       *
       * A interface mostra explicitamente
       * que o status atual não pôde ser verificado.
       */
      setServiceStatusError(
        "Não foi possível verificar a disponibilidade da equipe."
      );

    } finally {
      serviceStatusLoading =
        false;
    }
  }

  /*
   * Primeira consulta.
   */
  setServiceStatusLoading();

  loadServiceStatus();

  /*
   * Atualização automática.
   *
   * Só consulta novamente quando
   * a página está visível.
   */
  const SERVICE_STATUS_INTERVAL =
    15000;

  const serviceStatusTimer =
    setInterval(() => {
      if (
        document.visibilityState ===
        "visible"
      ) {
        loadServiceStatus();
      }
    }, SERVICE_STATUS_INTERVAL);

  document.addEventListener(
    "visibilitychange",
    () => {
      if (
        document.visibilityState ===
        "visible"
      ) {
        loadServiceStatus();
      }
    }
  );

  /* =========================================================
     BIBLIOTECA
  ========================================================= */

  const libraryGrid =
    $("#library-grid");

  const libraryEmpty =
    $("#library-empty");

  let libraryArticles = [];

  const demoArticles = [
    {
      id: "demo-fii",

      title:
        "O que é um FII?",

      excerpt:
        "Entenda de forma simples como funcionam os fundos imobiliários.",

      category:
        "investimentos",

      category_label:
        "Investimentos",

      icon:
        "🏢",

      content:
        `
          <p>
            Fundos imobiliários são veículos
            de investimento que podem reunir
            recursos de diferentes investidores
            para aplicação em ativos relacionados
            ao mercado imobiliário.
          </p>
        `
    },

    {
      id:
        "demo-renda-fixa",

      title:
        "Como funciona a renda fixa?",

      excerpt:
        "Conheça conceitos básicos relacionados à renda fixa.",

      category:
        "investimentos",

      category_label:
        "Investimentos",

      icon:
        "📈",

      content:
        `
          <p>
            Na renda fixa, a remuneração segue
            regras previamente estabelecidas
            ou parâmetros conhecidos no momento
            da aplicação.
          </p>
        `
    },

    {
      id:
        "demo-organizacao",

      title:
        "Como organizar seu dinheiro?",

      excerpt:
        "Conceitos básicos para começar a organizar suas finanças.",

      category:
        "financas",

      category_label:
        "Finanças",

      icon:
        "💰",

      content:
        `
          <p>
            Organizar as finanças começa pelo
            conhecimento da própria renda,
            despesas, objetivos e prioridades.
          </p>
        `
    },

    {
      id:
        "demo-diversificacao",

      title:
        "O que é diversificação?",

      excerpt:
        "Entenda o conceito de diversificação.",

      category:
        "investimentos",

      category_label:
        "Investimentos",

      icon:
        "🧩",

      content:
        `
          <p>
            Diversificação significa distribuir
            recursos entre diferentes ativos
            ou classes para evitar que todo
            o resultado dependa de uma única
            exposição.
          </p>
        `
    },

    {
      id:
        "demo-sistema",

      title:
        "O que é um sistema web?",

      excerpt:
        "Entenda como funcionam aplicações acessadas pelo navegador.",

      category:
        "tecnologia",

      category_label:
        "Tecnologia",

      icon:
        "💻",

      content:
        `
          <p>
            Um sistema web é uma aplicação
            que normalmente utiliza um navegador
            como interface e pode contar com
            servidores, bancos de dados e APIs.
          </p>
        `
    },

    {
      id:
        "demo-guia",

      title:
        "Guia para começar",

      excerpt:
        "Materiais educativos para quem está começando.",

      category:
        "guias",

      category_label:
        "Guias",

      icon:
        "📚",

      content:
        `
          <p>
            Começar a aprender tecnologia
            ou finanças envolve estabelecer
            uma base de conceitos e evoluir
            gradualmente.
          </p>
        `
    }
  ];

  function renderLibrary(
    articles = libraryArticles
  ) {
    if (!libraryGrid) {
      return;
    }

    if (!articles.length) {
      libraryGrid.innerHTML = "";

      if (libraryEmpty) {
        libraryEmpty.hidden =
          false;
      }

      return;
    }

    if (libraryEmpty) {
      libraryEmpty.hidden =
        true;
    }

    libraryGrid.innerHTML =
      articles
        .map(article => {
          const description =
            article.excerpt ||
            article.description ||
            "";

          return `
            <article
              class="card library-card reveal in"
              data-category="${escapeHTML(
                article.category ||
                  "geral"
              )}"
              data-article-id="${escapeHTML(
                article.id
              )}"
            >

              <span class="ic">
                ${escapeHTML(
                  article.icon ||
                    "📚"
                )}
              </span>

              <span class="library-category">
                ${escapeHTML(
                  article.category_label ||
                    article.category ||
                    "Conteúdo"
                )}
              </span>

              <h3>
                ${escapeHTML(
                  article.title ||
                    "Conteúdo Aureon"
                )}
              </h3>

              <p>
                ${escapeHTML(
                  description
                )}
              </p>

              <button
                class="text-button"
                type="button"
                data-library-id="${escapeHTML(
                  article.id
                )}"
              >
                Ler conteúdo
              </button>

            </article>
          `;
        })
        .join("");
  }

  async function loadLibrary() {
    if (!libraryGrid) {
      return;
    }

    showLoading(
      libraryGrid,
      "Carregando biblioteca"
    );

    if (!supabase) {
      libraryArticles =
        demoArticles;

      renderLibrary(
        libraryArticles
      );

      return;
    }

    try {
      const {
        data,
        error
      } = await supabase
        .from("articles")
        .select("*")
        .eq(
          "published",
          true
        )
        .order(
          "created_at",
          {
            ascending: false
          }
        );

      if (error) {
        throw error;
      }

      libraryArticles =
        data?.length
          ? data
          : demoArticles;

      renderLibrary(
        libraryArticles
      );

    } catch (error) {
      console.error(
        "[Aureon] Biblioteca:",
        error
      );

      libraryArticles =
        demoArticles;

      renderLibrary(
        libraryArticles
      );
    }
  }

  /* =========================================================
     FILTROS DA BIBLIOTECA
  ========================================================= */

  $$(".filter").forEach(
    button => {
      button.addEventListener(
        "click",
        () => {
          $$(".filter").forEach(
            item =>
              item.classList.remove(
                "active"
              )
          );

          button.classList.add(
            "active"
          );

          const filter =
            button.dataset.filter ||
            "todos";

          if (
            filter ===
            "todos"
          ) {
            renderLibrary(
              libraryArticles
            );

            return;
          }

          renderLibrary(
            libraryArticles.filter(
              article =>
                String(
                  article.category ||
                    ""
                ).toLowerCase() ===
                filter.toLowerCase()
            )
          );
        }
      );
    }
  );

  /* =========================================================
     MODAL DA BIBLIOTECA
  ========================================================= */

  const contentModal =
    $("#content-modal");

  const modalTitle =
    $("#modal-title");

  const modalBody =
    $("#modal-body");

  const modalCategory =
    $("#modal-category");

  function openModal(modal) {
    if (!modal) return;

    modal.classList.add(
      "open"
    );

    modal.setAttribute(
      "aria-hidden",
      "false"
    );

    document.body.classList.add(
      "modal-open"
    );
  }

  function closeModal(modal) {
    if (!modal) return;

    modal.classList.remove(
      "open"
    );

    modal.setAttribute(
      "aria-hidden",
      "true"
    );

    document.body.classList.remove(
      "modal-open"
    );
  }

  async function openArticle(
    id
  ) {
    const article =
      libraryArticles.find(
        item =>
          String(item.id) ===
          String(id)
      );

    if (!article) {
      toast(
        "Conteúdo não encontrado.",
        "error"
      );

      return;
    }

    currentArticleId =
      article.id;

    if (modalTitle) {
      modalTitle.textContent =
        article.title ||
        "Conteúdo Aureon";
    }

    if (modalCategory) {
      modalCategory.textContent =
        article.category_label ||
        article.category ||
        "Conteúdo";
    }

    if (modalBody) {
      modalBody.innerHTML =
        article.content ||
        `
          <p>
            ${escapeHTML(
              article.excerpt ||
                article.description ||
                ""
            )}
          </p>
        `;
    }

    const hiddenId =
      $("#comment-article-id");

    if (hiddenId) {
      hiddenId.value =
        article.id;
    }

    await loadComments(
      article.id
    );

    openModal(
      contentModal
    );
  }

  libraryGrid?.addEventListener(
    "click",
    event => {
      const button =
        event.target.closest(
          "[data-library-id]"
        );

      if (!button) return;

      openArticle(
        button.dataset.libraryId
      );
    }
  );

  $("#close-modal")?.addEventListener(
    "click",
    () =>
      closeModal(
        contentModal
      )
  );

  $(".modal-overlay", contentModal)
    ?.addEventListener(
      "click",
      () =>
        closeModal(
          contentModal
        )
    );

  /* =========================================================
     COMENTÁRIOS
  ========================================================= */

  async function loadComments(
    articleId
  ) {
    const list =
      $("#comments-list");

    if (!list) return;

    if (!supabase) {
      list.innerHTML = `
        <p class="muted">
          Os comentários estarão disponíveis
          quando a biblioteca online estiver conectada.
        </p>
      `;

      return;
    }

    try {
      const {
        data,
        error
      } = await supabase
        .from("comments")
        .select("*")
        .eq(
          "article_id",
          articleId
        )
        .eq(
          "approved",
          true
        )
        .order(
          "created_at",
          {
            ascending: false
          }
        );

      if (error) {
        throw error;
      }

      if (!data?.length) {
        list.innerHTML = `
          <p class="muted">
            Ainda não há comentários.
          </p>
        `;

        return;
      }

      list.innerHTML =
        data
          .map(
            comment => `
              <article class="comment">

                <strong>
                  ${escapeHTML(
                    comment.name ||
                      "Visitante"
                  )}
                </strong>

                <p>
                  ${escapeHTML(
                    comment.content ||
                      ""
                  )}
                </p>

              </article>
            `
          )
          .join("");

    } catch (error) {
      console.error(
        "[Aureon] Comentários:",
        error
      );

      list.innerHTML = `
        <p class="muted">
          Não foi possível carregar os comentários.
        </p>
      `;
    }
  }

  $("#comment-form")
    ?.addEventListener(
      "submit",
      async event => {
        event.preventDefault();

        const form =
          event.currentTarget;

        const status =
          $("#comment-status");

        const formData =
          new FormData(form);

        const name =
          String(
            formData.get(
              "name"
            ) || ""
          ).trim();

        const comment =
          String(
            formData.get(
              "comment"
            ) || ""
          ).trim();

        if (
          name.length < 2 ||
          comment.length < 3
        ) {
          if (status) {
            status.textContent =
              "Preencha os campos corretamente.";
          }

          return;
        }

        if (!supabase) {
          if (status) {
            status.textContent =
              "Comentários estarão disponíveis após a conexão com o banco.";
          }

          return;
        }

        try {
          const {
            error
          } = await supabase
            .from("comments")
            .insert({
              article_id:
                currentArticleId,

              name,

              content:
                comment,

              approved:
                false
            });

          if (error) {
            throw error;
          }

          form.reset();

          if (status) {
            status.textContent =
              "Comentário enviado para moderação.";
          }

          toast(
            "Comentário enviado.",
            "success"
          );

        } catch (error) {
          console.error(
            "[Aureon] Envio comentário:",
            error
          );

          if (status) {
            status.textContent =
              "Não foi possível enviar o comentário.";
          }
        }
      }
    );

  /* =========================================================
     PROJETOS
  ========================================================= */

  const projectsGrid =
    $("#projects-grid");

  const projectsEmpty =
    $("#projects-empty");

  async function loadProjects() {
    if (!projectsGrid) {
      return;
    }

    showLoading(
      projectsGrid,
      "Carregando projetos"
    );

    if (!supabase) {
      projectsGrid.innerHTML = `
        <article class="card project-card reveal in">
          <span class="ic">🚀</span>

          <span class="library-category">
            Aureon
          </span>

          <h3>
            Novos projetos
          </h3>

          <p>
            Esta área será atualizada conforme
            novos projetos forem desenvolvidos.
          </p>

          <span class="coming-label">
            Em desenvolvimento
          </span>
        </article>

        <article class="card project-card reveal in">
          <span class="ic">🧪</span>

          <span class="library-category">
            Laboratório
          </span>

          <h3>
            Aureon Labs
          </h3>

          <p>
            Experimentos, protótipos e novas
            ferramentas digitais.
          </p>

          <span class="coming-label">
            Em desenvolvimento
          </span>
        </article>
      `;

      return;
    }

    try {
      const {
        data,
        error
      } = await supabase
        .from("projects")
        .select("*")
        .eq(
          "published",
          true
        )
        .order(
          "created_at",
          {
            ascending: false
          }
        );

      if (error) {
        throw error;
      }

      if (!data?.length) {
        projectsGrid.innerHTML = "";

        if (projectsEmpty) {
          projectsEmpty.hidden =
            false;
        }

        return;
      }

      if (projectsEmpty) {
        projectsEmpty.hidden =
          true;
      }

      projectsGrid.innerHTML =
        data
          .map(
            project => `
              <article
                class="card project-card reveal in"
              >

                ${
                  project.image_url
                    ? `
                      <img
                        src="${escapeHTML(
                          project.image_url
                        )}"
                        alt="${escapeHTML(
                          project.title ||
                            "Projeto Aureon"
                        )}"
                        loading="lazy"
                      >
                    `
                    : `
                      <span class="ic">
                        🚀
                      </span>
                    `
                }

                <span class="library-category">
                  Projeto
                </span>

                <h3>
                  ${escapeHTML(
                    project.title ||
                      "Projeto Aureon"
                  )}
                </h3>

                <p>
                  ${escapeHTML(
                    project.description ||
                      ""
                  )}
                </p>

                ${
                  project.link
                    ? `
                      <a
                        class="text-button"
                        href="${escapeHTML(
                          project.link
                        )}"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Ver projeto
                      </a>
                    `
                    : ""
                }

              </article>
            `
          )
          .join("");

    } catch (error) {
      console.error(
        "[Aureon] Projetos:",
        error
      );

      showDataError(
        projectsGrid,
        "O banco de dados não respondeu. Tente novamente."
      );
    }
  }

  /* =========================================================
     NOVIDADES
  ========================================================= */

  const newsGrid =
    $("#news-grid");

  const newsEmpty =
    $("#news-empty");

  async function loadNews() {
    if (!newsGrid) {
      return;
    }

    showLoading(
      newsGrid,
      "Carregando novidades"
    );

    if (!supabase) {
      newsGrid.innerHTML = `
        <article class="card reveal in">

          <span class="ic">
            🚀
          </span>

          <span class="library-category">
            Aureon
          </span>

          <h3>
            A Aureon está apenas começando
          </h3>

          <p>
            Novas soluções, ferramentas e
            conteúdos serão publicados em breve.
          </p>

          <span class="coming-label">
            Atualização
          </span>

        </article>
      `;

      return;
    }

    try {
      const {
        data,
        error
      } = await supabase
        .from("news")
        .select("*")
        .eq(
          "published",
          true
        )
        .order(
          "created_at",
          {
            ascending: false
          }
        )
        .limit(6);

      if (error) {
        throw error;
      }

      if (!data?.length) {
        newsGrid.innerHTML = "";

        if (newsEmpty) {
          newsEmpty.hidden =
            false;
        }

        return;
      }

      if (newsEmpty) {
        newsEmpty.hidden =
          true;
      }

      newsGrid.innerHTML =
        data
          .map(
            item => `
              <article class="card reveal in">

                <span class="ic">
                  ${escapeHTML(
                    item.icon ||
                      "📰"
                  )}
                </span>

                <span class="library-category">
                  Atualização
                </span>

                <h3>
                  ${escapeHTML(
                    item.title ||
                      "Novidade Aureon"
                  )}
                </h3>

                <p>
                  ${escapeHTML(
                    item.description ||
                      item.excerpt ||
                      ""
                  )}
                </p>

              </article>
            `
          )
          .join("");

    } catch (error) {
      console.error(
        "[Aureon] Novidades:",
        error
      );

      showDataError(
        newsGrid,
        "Não foi possível carregar as novidades."
      );
    }
  }

  /* =========================================================
     RETRY DOS CONTEÚDOS
  ========================================================= */

  document.addEventListener(
    "click",
    event => {
      const button =
        event.target.closest(
          "[data-retry-content]"
        );

      if (!button) return;

      const parent =
        button.closest(
          "[data-retry-section]"
        );

      if (!parent) {
        loadLibrary();
        loadProjects();
        loadNews();
      }
    }
  );

  /* =========================================================
     CALCULADORA DE INVESTIMENTOS
  ========================================================= */

  function money(value) {
    return Number(
      value || 0
    ).toLocaleString(
      "pt-BR",
      {
        style:
          "currency",

        currency:
          "BRL"
      }
    );
  }

  function calculateInvestment() {
    const initial =
      Number(
        $("#calc-initial")
          ?.value
      ) || 0;

    const monthly =
      Number(
        $("#calc-monthly")
          ?.value
      ) || 0;

    const rate =
      (
        Number(
          $("#calc-rate")
            ?.value
        ) || 0
      ) / 100;

    const months =
      Math.max(
        0,
        Number(
          $("#calc-months")
            ?.value
        ) || 0
      );

    let finalValue;

    if (rate === 0) {
      finalValue =
        initial +
        monthly *
          months;
    } else {
      finalValue =
        initial *
          Math.pow(
            1 + rate,
            months
          ) +
        monthly *
          (
            (
              Math.pow(
                1 + rate,
                months
              ) - 1
            ) /
            rate
          );
    }

    const contributed =
      initial +
      monthly *
        months;

    const interest =
      finalValue -
      contributed;

    const finalElement =
      $("#calc-final");

    const contributedElement =
      $("#calc-contributed");

    const interestElement =
      $("#calc-interest");

    if (finalElement) {
      finalElement.textContent =
        money(finalValue);
    }

    if (contributedElement) {
      contributedElement.textContent =
        money(contributed);
    }

    if (interestElement) {
      interestElement.textContent =
        money(interest);
    }
  }

  $("#calculate-investment")
    ?.addEventListener(
      "click",
      calculateInvestment
    );

  /* =========================================================
     MODAL DE CALCULADORAS
  ========================================================= */

  const calculatorModal =
    $("#calculator-modal");

  const calculatorTitle =
    $("#calculator-modal-title");

  const calculatorBody =
    $("#calculator-modal-body");

  function openCalculator(
    type
  ) {
    if (
      !calculatorModal ||
      !calculatorBody ||
      !calculatorTitle
    ) {
      return;
    }

    if (
      type ===
      "compound"
    ) {
      calculatorTitle.textContent =
        "Juros compostos";

      calculatorBody.innerHTML = `
        <div class="calculator-grid">

          <label>
            Capital inicial

            <input
              id="compound-capital"
              type="number"
              min="0"
              value="1000"
            >
          </label>

          <label>
            Taxa mensal (%)

            <input
              id="compound-rate"
              type="number"
              min="0"
              step="0.01"
              value="0.8"
            >
          </label>

          <label>
            Período (meses)

            <input
              id="compound-months"
              type="number"
              min="1"
              value="60"
            >
          </label>

        </div>

        <button
          class="btn"
          id="run-compound"
          type="button"
        >
          Calcular
        </button>

        <div
          class="calculator-result"
          id="compound-result"
        >
          Informe os valores e calcule.
        </div>
      `;

      $("#run-compound")
        ?.addEventListener(
          "click",
          () => {
            const capital =
              Number(
                $("#compound-capital")
                  ?.value
              ) || 0;

            const rate =
              (
                Number(
                  $("#compound-rate")
                    ?.value
                ) || 0
              ) / 100;

            const months =
              Number(
                $("#compound-months")
                  ?.value
              ) || 0;

            const result =
              capital *
              Math.pow(
                1 + rate,
                months
              );

            const resultElement =
              $("#compound-result");

            if (
              resultElement
            ) {
              resultElement.innerHTML = `
                <strong>
                  Valor final estimado:
                  ${money(result)}
                </strong>
              `;
            }
          }
        );
    }

    if (
      type ===
      "dividends"
    ) {
      calculatorTitle.textContent =
        "Simulador de dividendos";

      calculatorBody.innerHTML = `
        <div class="calculator-grid">

          <label>
            Patrimônio

            <input
              id="div-capital"
              type="number"
              min="0"
              value="10000"
            >
          </label>

          <label>
            Rendimento anual (%)

            <input
              id="div-yield"
              type="number"
              min="0"
              step="0.01"
              value="10"
            >
          </label>

        </div>

        <button
          class="btn"
          id="run-dividends"
          type="button"
        >
          Calcular
        </button>

        <div
          class="calculator-result"
          id="dividend-result"
        >
          Informe os valores e calcule.
        </div>
      `;

      $("#run-dividends")
        ?.addEventListener(
          "click",
          () => {
            const capital =
              Number(
                $("#div-capital")
                  ?.value
              ) || 0;

            const annualYield =
              (
                Number(
                  $("#div-yield")
                    ?.value
                ) || 0
              ) / 100;

            const annual =
              capital *
              annualYield;

            const monthly =
              annual / 12;

            const resultElement =
              $("#dividend-result");

            if (
              resultElement
            ) {
              resultElement.innerHTML = `
                <div>
                  Estimativa anual:
                  <strong>
                    ${money(annual)}
                  </strong>
                </div>

                <div>
                  Média mensal hipotética:
                  <strong>
                    ${money(monthly)}
                  </strong>
                </div>

                <small>
                  Simulação matemática. Não representa
                  garantia de rendimento.
                </small>
              `;
            }
          }
        );
    }

    if (
      type ===
      "financing"
    ) {
      calculatorTitle.textContent =
        "Simulador de financiamento";

      calculatorBody.innerHTML = `
        <div class="calculator-grid">

          <label>
            Valor financiado

            <input
              id="fin-value"
              type="number"
              min="0"
              value="100000"
            >
          </label>

          <label>
            Taxa mensal (%)

            <input
              id="fin-rate"
              type="number"
              min="0"
              step="0.01"
              value="1"
            >
          </label>

          <label>
            Prazo (meses)

            <input
              id="fin-months"
              type="number"
              min="1"
              value="120"
            >
          </label>

        </div>

        <button
          class="btn"
          id="run-financing"
          type="button"
        >
          Calcular
        </button>

        <div
          class="calculator-result"
          id="financing-result"
        >
          Informe os valores e calcule.
        </div>
      `;

      $("#run-financing")
        ?.addEventListener(
          "click",
          () => {
            const value =
              Number(
                $("#fin-value")
                  ?.value
              ) || 0;

            const rate =
              (
                Number(
                  $("#fin-rate")
                    ?.value
                ) || 0
              ) / 100;

            const months =
              Number(
                $("#fin-months")
                  ?.value
              ) || 0;

            if (
              months <= 0
            ) {
              toast(
                "Informe um prazo válido.",
                "error"
              );

              return;
            }

            let installment;

            if (
              rate === 0
            ) {
              installment =
                value /
                months;
            } else {
              const factor =
                Math.pow(
                  1 + rate,
                  months
                );

              installment =
                value *
                (
                  rate *
                  factor
                ) /
                (
                  factor - 1
                );
            }

            const total =
              installment *
              months;

            const interest =
              total -
              value;

            const resultElement =
              $("#financing-result");

            if (
              resultElement
            ) {
              resultElement.innerHTML = `
                <div>
                  Parcela estimada:
                  <strong>
                    ${money(
                      installment
                    )}
                  </strong>
                </div>

                <div>
                  Total:
                  <strong>
                    ${money(
                      total
                    )}
                  </strong>
                </div>

                <div>
                  Juros simulados:
                  <strong>
                    ${money(
                      interest
                    )}
                  </strong>
                </div>

                <small>
                  Simulação matemática. Valores reais
                  dependem das condições da instituição
                  financeira.
                </small>
              `;
            }
          }
        );
    }

    openModal(
      calculatorModal
    );
  }

  $$(
    "[data-calculator]"
  ).forEach(
    button => {
      button.addEventListener(
        "click",
        () => {
          openCalculator(
            button.dataset
              .calculator
          );
        }
      );
    }
  );

  $("#close-calculator")
    ?.addEventListener(
      "click",
      () =>
        closeModal(
          calculatorModal
        )
    );

  $(".modal-overlay", calculatorModal)
    ?.addEventListener(
      "click",
      () =>
        closeModal(
          calculatorModal
        )
    );

  /* =========================================================
     FORMULÁRIO / CRM
  ========================================================= */

  const contactForm =
    $("#form");

  const validationRules = {
    nome: value =>
      value.trim().length >= 2 ||
      "Informe seu nome.",

    email: value =>
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        value
      ) ||
      "Informe um e-mail válido.",

    whats: value =>
      value.replace(
        /\D/g,
        ""
      ).length >= 10 ||
      "Informe um WhatsApp válido.",

    assunto: value =>
      value.trim().length >= 3 ||
      "Informe o assunto.",

    msg: value =>
      value.trim().length >= 10 ||
      "Escreva pelo menos 10 caracteres."
  };

  function validateContactForm() {
    if (!contactForm) {
      return false;
    }

    let valid = true;

    Object.entries(
      validationRules
    ).forEach(
      ([field, rule]) => {
        const input =
          contactForm.elements[
            field
          ];

        if (!input) {
          return;
        }

        const result =
          rule(
            String(
              input.value ||
                ""
            )
          );

        const invalid =
          result !== true;

        input.classList.toggle(
          "bad",
          invalid
        );

        const small =
          input.parentElement
            ?.querySelector(
              "small"
            );

        if (small) {
          small.textContent =
            invalid
              ? result
              : "";
        }

        if (invalid) {
          valid = false;
        }
      }
    );

    return valid;
  }

  async function saveLead(
    data
  ) {
    if (!supabase) {
      return false;
    }

    const fullMessage = [
      data.assunto
        ? `Assunto: ${data.assunto}`
        : "",

      data.orcamento
        ? `Orçamento: ${data.orcamento}`
        : "",

      data.msg
        ? `Mensagem: ${data.msg}`
        : ""
    ]
      .filter(Boolean)
      .join("\n\n");

    const {
      error
    } = await supabase
      .from("leads")
      .insert({
        nome:
          data.nome,

        email:
          data.email,

        whatsapp:
          data.whats,

        empresa:
          null,

        servico:
          data.servico,

        mensagem:
          fullMessage,

        status:
          "LEAD"
      });

    if (error) {
      console.error(
        "[Aureon] Lead:",
        error
      );

      throw error;
    }

    return true;
  }

  contactForm?.addEventListener(
    "submit",
    async event => {
      event.preventDefault();

      const honeypot =
        contactForm.elements.site;

      if (
        honeypot &&
        honeypot.value
      ) {
        return;
      }

      if (
        !validateContactForm()
      ) {
        return;
      }

      const button =
        contactForm.querySelector(
          'button[type="submit"]'
        );

      const originalText =
        button?.textContent ||
        "Enviar solicitação";

      if (button) {
        button.disabled =
          true;

        button.textContent =
          "Enviando...";
      }

      const formData =
        new FormData(
          contactForm
        );

      const data = {
        nome:
          String(
            formData.get(
              "nome"
            ) || ""
          ).trim(),

        email:
          String(
            formData.get(
              "email"
            ) || ""
          ).trim(),

        whats:
          String(
            formData.get(
              "whats"
            ) || ""
          ).trim(),

        servico:
          String(
            formData.get(
              "servico"
            ) || ""
          ).trim(),

        assunto:
          String(
            formData.get(
              "assunto"
            ) || ""
          ).trim(),

        orcamento:
          String(
            formData.get(
              "orcamento"
            ) || ""
          ).trim(),

        msg:
          String(
            formData.get(
              "msg"
            ) || ""
          ).trim()
      };

      try {
        if (supabase) {
          await saveLead(
            data
          );

          const ok =
            $("#ok");

          if (ok) {
            ok.hidden =
              false;

            ok.textContent =
              "Mensagem enviada com sucesso! A Aureon recebeu sua solicitação.";
          }

          toast(
            "Solicitação enviada com sucesso.",
            "success"
          );

          contactForm.reset();

        } else {
          const message =
            `Olá, Aureon!\n\n` +
            `Nome: ${data.nome}\n` +
            `Serviço: ${data.servico}\n` +
            `Assunto: ${data.assunto}\n` +
            `Orçamento: ${data.orcamento || "Não informado"}\n` +
            `Mensagem: ${data.msg}\n\n` +
            `E-mail: ${data.email}\n` +
            `WhatsApp: ${data.whats}`;

          const whatsappURL =
            `${WA_BASE}?text=${encodeURIComponent(
              message
            )}`;

          window.open(
            whatsappURL,
            "_blank",
            "noopener,noreferrer"
          );

          contactForm.reset();

          const ok =
            $("#ok");

          if (ok) {
            ok.hidden =
              false;

            ok.textContent =
              "Abrindo o WhatsApp para concluir o contato...";
          }
        }

      } catch (error) {
        console.error(
          "[Aureon] Formulário:",
          error
        );

        toast(
          "Não foi possível enviar agora. Tente novamente.",
          "error"
        );

      } finally {
        if (button) {
          button.disabled =
            false;

          button.textContent =
            originalText;
        }
      }
    }
  );

  /* =========================================================
     AUREON AI
  ========================================================= */

  const aiChat =
    $("#ai-chat");

  const aiMessages =
    $("#ai-messages");

  const aiForm =
    $("#ai-form");

  const aiInput =
    $("#ai-input");

  let aiBusy = false;

  /*
   * Estado visual opcional da IA.
   *
   * Caso o HTML tenha um elemento como:
   *
   * #ai-status
   *
   * ele será atualizado automaticamente.
   */

  function setAIStatus(
    status,
    message
  ) {
    const element =
      $("#ai-status");

    if (!element) {
      return;
    }

    element.classList.remove(
      "online",
      "offline",
      "loading",
      "error",
      "available",
      "busy"
    );

    element.classList.add(
      status
    );

    element.dataset.status =
      status;

    if (message) {
      element.textContent =
        message;
    }

    element.setAttribute(
      "aria-label",
      message ||
        `Aureon AI: ${status}`
    );
  }

  function openAI() {
    if (!aiChat) {
      return;
    }

    aiChat.classList.add(
      "open"
    );

    aiChat.setAttribute(
      "aria-hidden",
      "false"
    );

    if (
      aiMessages &&
      !aiMessages.children.length
    ) {
      addAIMessage(
        "Olá! Eu sou a Aureon AI. Posso ajudar com tecnologia, sistemas, ideias de projetos, organização financeira e dúvidas sobre a Aureon.",
        "bot"
      );
    }

    setTimeout(
      () =>
        aiInput?.focus(),
      100
    );
  }

  function closeAI() {
    if (!aiChat) {
      return;
    }

    aiChat.classList.remove(
      "open"
    );

    aiChat.setAttribute(
      "aria-hidden",
      "true"
    );
  }

  $("#open-ai")
    ?.addEventListener(
      "click",
      openAI
    );

  $("#ai-floating")
    ?.addEventListener(
      "click",
      openAI
    );

  $("#close-ai")
    ?.addEventListener(
      "click",
      closeAI
    );

  function addAIMessage(
    message,
    type = "bot"
  ) {
    if (!aiMessages) {
      return;
    }

    const element =
      document.createElement(
        "div"
      );

    element.className =
      `ai-message ${type}`;

    element.innerHTML =
      escapeHTML(
        message
      ).replaceAll(
        "\n",
        "<br>"
      );

    aiMessages.appendChild(
      element
    );

    aiMessages.scrollTop =
      aiMessages.scrollHeight;
  }

  async function askAI(
    message
  ) {
    setAIStatus(
      "loading",
      "Aureon AI está processando..."
    );

    let response;

    try {
      response =
        await fetch(
          "/.netlify/functions/chat",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",

              "Accept":
                "application/json"
            },

            body:
              JSON.stringify({
                message
              })
          }
        );
    } catch (networkError) {
      setAIStatus(
        "offline",
        "Aureon AI indisponível"
      );

      throw new Error(
        "Não foi possível conectar à função da Aureon AI."
      );
    }

    /*
     * HTTP 404, 500, 502 etc.
     * são erros reais do endpoint.
     */
    if (!response.ok) {
      setAIStatus(
        "offline",
        "Aureon AI indisponível"
      );

      throw new Error(
        `Falha na comunicação com a Aureon AI. HTTP ${response.status}.`
      );
    }

    let data;

    try {
      data =
        await response.json();
    } catch (jsonError) {
      setAIStatus(
        "error",
        "Resposta inválida da Aureon AI"
      );

      throw new Error(
        "A resposta da Aureon AI não é um JSON válido."
      );
    }

    const reply =
      data?.reply ||
      data?.message ||
      data?.response ||
      "";

    if (
      typeof reply !==
        "string" ||
      !reply.trim()
    ) {
      setAIStatus(
        "error",
        "Aureon AI retornou uma resposta inválida"
      );

      throw new Error(
        "A Aureon AI não retornou uma mensagem válida."
      );
    }

    setAIStatus(
      "online",
      "Aureon AI online"
    );

    return reply.trim();
  }

  aiForm?.addEventListener(
    "submit",
    async event => {
      event.preventDefault();

      if (aiBusy) {
        return;
      }

      const message =
        aiInput?.value.trim();

      if (!message) {
        return;
      }

      if (
        message.length >
        1000
      ) {
        toast(
          "Sua mensagem é muito longa.",
          "error"
        );

        return;
      }

      aiBusy = true;

      const submitButton =
        aiForm.querySelector(
          'button[type="submit"]'
        );

      if (submitButton) {
        submitButton.disabled =
          true;
      }

      addAIMessage(
        message,
        "user"
      );

      if (aiInput) {
        aiInput.value =
          "";
      }

      const typing =
        document.createElement(
          "div"
        );

      typing.className =
        "ai-message bot ai-typing";

      typing.textContent =
        "Aureon AI está digitando...";

      aiMessages?.appendChild(
        typing
      );

      if (aiMessages) {
        aiMessages.scrollTop =
          aiMessages.scrollHeight;
      }

      try {
        const answer =
          await askAI(
            message
          );

        typing.remove();

        addAIMessage(
          answer,
          "bot"
        );

      } catch (error) {
        console.error(
          "[Aureon AI]",
          error
        );

        typing.remove();

        addAIMessage(
          "Não consegui conectar ao servidor da Aureon AI agora. Tente novamente em alguns instantes.",
          "bot"
        );

      } finally {
        aiBusy =
          false;

        if (submitButton) {
          submitButton.disabled =
            false;
        }

        aiInput?.focus();
      }
    }
  );

  /* =========================================================
     ESC / MODAIS
  ========================================================= */

  document.addEventListener(
    "keydown",
    event => {
      if (
        event.key !==
        "Escape"
      ) {
        return;
      }

      closeModal(
        contentModal
      );

      closeModal(
        calculatorModal
      );

      closeAI();
    }
  );

  /* =========================================================
     INICIALIZAÇÃO
  ========================================================= */

  async function initialize() {
    await Promise.allSettled([
      loadLibrary(),
      loadProjects(),
      loadNews()
    ]);

    calculateInvestment();
  }

  initialize();

  /* =========================================================
     EXPORTAÇÃO
  ========================================================= */

  window.Aureon = {
    toast,

    openAI,

    closeAI,

    openArticle,

    openCalculator,

    calculateInvestment,

    loadServiceStatus,

    loadLibrary,

    loadProjects,

    loadNews,

    initialize,

    getServiceStatus:
      () =>
        lastConfirmedServiceStatus,

    getAIStatus:
      () =>
        $("#ai-status")
          ?.dataset.status ||
        null,

    refresh:
      initialize
  };

})();