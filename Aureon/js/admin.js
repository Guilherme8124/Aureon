(() => {
    "use strict";

    /*
    ============================================================
    AUREON ADMIN
    ============================================================
    CRUD:
    - Projetos
    - Biblioteca / Artigos
    - Novidades
    - Leads
    - Mensagens
    - Configurações
    - Status do atendimento

    STATUS:
    available = Disponível
    busy      = Em atendimento
    offline   = Indisponível

    IMPORTANTE:
    Erros de conexão NÃO são convertidos em "offline".
    Somente o valor realmente salvo no banco define o status.
    ============================================================
    */

    const CONFIG = window.AUREON_CONFIG || {};

    const SUPABASE_URL =
        CONFIG.SUPABASE_URL || "";

    const SUPABASE_ANON_KEY =
        CONFIG.SUPABASE_ANON_KEY || "";

    let supabaseClient = null;
    let currentUser = null;
    let currentSection = "dashboard";

    /*
    ============================================================
    ESTADO GLOBAL
    ============================================================
    */

    let serviceStatusInterval = null;

    /*
    Último status CONFIRMADO pelo banco.

    Nunca usamos "available" ou "offline" como fallback
    quando existe erro de consulta.
    */

    let currentServiceStatus = null;

    let serviceStatusLoading = false;

    /*
    ============================================================
    CONFIGURAÇÃO DOS CRUDS
    ============================================================
    */

    const CRUD_CONFIG = {

        projects: {
            title: "Projetos",
            singular: "Projeto",
            container: "admin-projects",
            table: "projects",

            fields: [
                {
                    name: "title",
                    label: "Título",
                    type: "text",
                    required: true
                },

                {
                    name: "slug",
                    label: "Slug",
                    type: "text"
                },

                {
                    name: "description",
                    label: "Descrição",
                    type: "textarea"
                },

                {
                    name: "content",
                    label: "Conteúdo",
                    type: "textarea"
                },

                {
                    name: "image",
                    label: "Imagem",
                    type: "image"
                },

                {
                    name: "category",
                    label: "Categoria",
                    type: "text"
                },

                {
                    name: "link",
                    label: "Link do projeto",
                    type: "url"
                },

                {
                    name: "published",
                    label: "Publicado",
                    type: "checkbox"
                }
            ]
        },

        articles: {
            title: "Biblioteca",
            singular: "Artigo",
            container: "admin-articles",
            table: "articles",

            fields: [
                {
                    name: "title",
                    label: "Título",
                    type: "text",
                    required: true
                },

                {
                    name: "slug",
                    label: "Slug",
                    type: "text"
                },

                {
                    name: "excerpt",
                    label: "Resumo / Descrição",
                    type: "textarea"
                },

                {
                    name: "content",
                    label: "Conteúdo",
                    type: "textarea"
                },

                {
                    name: "image",
                    label: "Imagem",
                    type: "image"
                },

                {
                    name: "category",
                    label: "Categoria",
                    type: "text"
                },

                {
                    name: "author",
                    label: "Autor",
                    type: "text"
                },

                {
                    name: "published",
                    label: "Publicado",
                    type: "checkbox"
                }
            ]
        },

        news: {
            title: "Novidades",
            singular: "Novidade",
            container: "admin-news",
            table: "news",

            fields: [
                {
                    name: "title",
                    label: "Título",
                    type: "text",
                    required: true
                },

                {
                    name: "slug",
                    label: "Slug",
                    type: "text"
                },

                {
                    name: "description",
                    label: "Descrição",
                    type: "textarea"
                },

                {
                    name: "content",
                    label: "Conteúdo",
                    type: "textarea"
                },

                {
                    name: "image",
                    label: "Imagem",
                    type: "image"
                },

                {
                    name: "category",
                    label: "Categoria",
                    type: "text"
                },

                {
                    name: "url",
                    label: "Link",
                    type: "url"
                },

                {
                    name: "published",
                    label: "Publicado",
                    type: "checkbox"
                }
            ]
        }

    };


    /*
    ============================================================
    ELEMENTOS
    ============================================================
    */

    const loginScreen =
        document.getElementById("login-screen");

    const adminApp =
        document.getElementById("admin-app");

    const loginForm =
        document.getElementById("login-form");

    const loginError =
        document.getElementById("login-error");

    const loginButton =
        document.getElementById("login-button");

    const logoutButton =
        document.getElementById("logout");

    const pageTitle =
        document.getElementById("admin-page-title");

    const adminUserEmail =
        document.getElementById("admin-user-email");

    const refreshButton =
        document.getElementById("refresh-dashboard");


    /*
    ============================================================
    UTILITÁRIOS
    ============================================================
    */

    function escapeHTML(value) {

        if (
            value === null ||
            value === undefined
        ) {
            return "";
        }

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    function slugify(text) {

        return String(text || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");
    }


    function formatDate(value) {

        if (!value) {
            return "—";
        }

        try {

            return new Date(value)
                .toLocaleDateString(
                    "pt-BR"
                );

        } catch {

            return String(value);

        }
    }


    function showToast(message) {

        let toast =
            document.getElementById(
                "admin-toast"
            );

        if (!toast) {

            toast =
                document.createElement(
                    "div"
                );

            toast.id =
                "admin-toast";

            toast.className =
                "admin-toast";

            document.body.appendChild(
                toast
            );
        }

        toast.textContent =
            message;

        toast.hidden = false;

        clearTimeout(
            toast._timer
        );

        toast._timer =
            setTimeout(() => {

                toast.hidden = true;

            }, 3500);
    }


    function showLoginError(message) {

        if (loginError) {

            loginError.textContent =
                message || "";

        }
    }


    function setText(id, value) {

        const element =
            document.getElementById(id);

        if (element) {

            element.textContent =
                value;

        }
    }


    function getErrorMessage(error) {

        if (!error) {
            return "Erro desconhecido.";
        }

        return (
            error.message ||
            error.details ||
            error.hint ||
            "Erro desconhecido."
        );
    }


    /*
    ============================================================
    SUPABASE
    ============================================================
    */

    function initializeSupabase() {

        if (!window.supabase) {

            showLoginError(
                "Biblioteca do Supabase não carregada."
            );

            return false;
        }

        if (
            !SUPABASE_URL ||
            !SUPABASE_ANON_KEY
        ) {

            showLoginError(
                "Configuração do Supabase não encontrada."
            );

            return false;
        }

        try {

            supabaseClient =
                window.supabase.createClient(
                    SUPABASE_URL,
                    SUPABASE_ANON_KEY
                );

            return true;

        } catch (error) {

            console.error(
                "Erro inicializando Supabase:",
                error
            );

            showLoginError(
                "Não foi possível inicializar o Supabase."
            );

            return false;
        }
    }


    /*
    ============================================================
    LOGIN
    ============================================================
    */

    async function login(
        email,
        password
    ) {

        if (!supabaseClient) {
            return;
        }

        if (!email || !password) {

            showLoginError(
                "Informe e-mail e senha."
            );

            return;
        }

        if (loginButton) {

            loginButton.disabled = true;

            loginButton.textContent =
                "Entrando...";
        }

        showLoginError("");

        try {

            const {
                data,
                error
            } =
                await supabaseClient.auth
                    .signInWithPassword({
                        email,
                        password
                    });

            if (error) {
                throw error;
            }

            currentUser =
                data.user;

            await openAdmin();

        } catch (error) {

            console.error(
                "Erro no login:",
                error
            );

            showLoginError(
                getErrorMessage(error)
            );

        } finally {

            if (loginButton) {

                loginButton.disabled = false;

                loginButton.textContent =
                    "Entrar";
            }
        }
    }


    async function checkSession() {

        if (!supabaseClient) {
            return;
        }

        try {

            const {
                data,
                error
            } =
                await supabaseClient.auth
                    .getSession();

            if (error) {
                throw error;
            }

            if (
                data.session &&
                data.session.user
            ) {

                currentUser =
                    data.session.user;

                await openAdmin();

            } else {

                loginScreen.hidden =
                    false;

                adminApp.hidden =
                    true;
            }

        } catch (error) {

            console.error(
                "Erro verificando sessão:",
                error
            );

            loginScreen.hidden =
                false;

            adminApp.hidden =
                true;
        }
    }


    async function logout() {

        stopServiceStatusPolling();

        try {

            if (supabaseClient) {

                await supabaseClient.auth
                    .signOut();
            }

        } catch (error) {

            console.error(
                "Erro ao sair:",
                error
            );

        }

        currentUser = null;
        currentServiceStatus = null;

        adminApp.hidden =
            true;

        loginScreen.hidden =
            false;

        loginForm?.reset();

        showLoginError("");
    }


    /*
    ============================================================
    ABRIR PAINEL
    ============================================================
    */

    async function openAdmin() {

        loginScreen.hidden = true;
        adminApp.hidden = false;

        if (adminUserEmail) {

            adminUserEmail.textContent =
                currentUser?.email ||
                "Administrador";
        }

        await loadDashboard();

        showSection("dashboard");

        startServiceStatusPolling();
    }


    /*
    ============================================================
    NAVEGAÇÃO
    ============================================================
    */

    function showSection(section) {

        currentSection =
            section;

        document
            .querySelectorAll(
                ".admin-section"
            )
            .forEach(element => {

                element.classList.remove(
                    "active"
                );

            });


        const target =
            document.getElementById(
                `section-${section}`
            );


        if (!target) {
            return;
        }


        target.classList.add(
            "active"
        );


        document
            .querySelectorAll(
                "[data-section]"
            )
            .forEach(button => {

                button.classList.toggle(
                    "active",
                    button.dataset.section ===
                    section
                );

            });


        const titles = {

            dashboard: "Dashboard",
            leads: "Leads",
            messages: "Mensagens",
            quotes: "Orçamentos",
            library: "Biblioteca",
            news: "Novidades",
            projects: "Projetos",
            comments: "Comentários",
            ai: "Aureon AI",
            statistics: "Estatísticas",
            settings: "Configurações",
            "service-status":
                "Status do serviço"

        };


        if (pageTitle) {

            pageTitle.textContent =
                titles[section] ||
                "Aureon";
        }


        if (
            CRUD_CONFIG[section]
        ) {

            loadCrud(section);
        }


        if (section === "library") {

            loadCrud("articles");
        }


        if (section === "leads") {

            loadSimpleTable(
                "leads",
                "admin-leads"
            );
        }


        if (section === "messages") {

            loadSimpleTable(
                "messages",
                "admin-messages"
            );
        }


        if (section === "settings") {

            loadSettings();
        }


        if (
            section ===
            "service-status"
        ) {

            loadServiceStatus();
        }
    }


    document
        .querySelectorAll(
            "[data-section]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    showSection(
                        button.dataset.section
                    );

                }
            );

        });


    /*
    ============================================================
    DASHBOARD
    ============================================================
    */

    async function countTable(table) {

        if (!supabaseClient) {

            return {
                ok: false,
                count: null
            };
        }

        try {

            const {
                count,
                error
            } =
                await supabaseClient
                    .from(table)
                    .select(
                        "*",
                        {
                            count: "exact",
                            head: true
                        }
                    );

            if (error) {

                console.error(
                    `Erro contando ${table}:`,
                    error
                );

                return {
                    ok: false,
                    count: null
                };
            }

            return {
                ok: true,
                count: count || 0
            };

        } catch (error) {

            console.error(
                `Erro contando ${table}:`,
                error
            );

            return {
                ok: false,
                count: null
            };
        }
    }


    async function loadDashboard() {

        if (!supabaseClient) {
            return;
        }

        const [
            projectsResult,
            articlesResult,
            newsResult,
            messagesResult,
            leadsResult
        ] =
            await Promise.all([
                countTable("projects"),
                countTable("articles"),
                countTable("news"),
                countTable("messages"),
                countTable("leads")
            ]);


        setText(
            "total-projects",
            projectsResult.ok
                ? projectsResult.count
                : "—"
        );

        setText(
            "total-articles",
            articlesResult.ok
                ? articlesResult.count
                : "—"
        );

        setText(
            "total-messages",
            messagesResult.ok
                ? messagesResult.count
                : "—"
        );

        setText(
            "total-leads",
            leadsResult.ok
                ? leadsResult.count
                : "—"
        );


        setText(
            "statistics-projects",
            projectsResult.ok
                ? projectsResult.count
                : "—"
        );

        setText(
            "statistics-articles",
            articlesResult.ok
                ? articlesResult.count
                : "—"
        );

        setText(
            "statistics-messages",
            messagesResult.ok
                ? messagesResult.count
                : "—"
        );

        setText(
            "statistics-leads",
            leadsResult.ok
                ? leadsResult.count
                : "—"
        );


        await loadServiceStatus();
    }


    /*
    ============================================================
    CRUD
    ============================================================
    */

    async function loadCrud(type) {

        const config =
            CRUD_CONFIG[type];

        if (!config) {
            return;
        }


        const container =
            document.getElementById(
                config.container
            );

        if (!container) {
            return;
        }


        container.innerHTML = `
            <div class="admin-loading">
                Carregando ${escapeHTML(
                    config.title.toLowerCase()
                )}...
            </div>
        `;


        try {

            const {
                data,
                error
            } =
                await supabaseClient
                    .from(config.table)
                    .select("*")
                    .order(
                        "created_at",
                        {
                            ascending: false
                        }
                    );


            if (error) {
                throw error;
            }


            renderCrud(
                type,
                data || []
            );

        } catch (error) {

            console.error(
                `Erro carregando ${config.table}:`,
                error
            );


            container.innerHTML = `

                <div class="admin-error">

                    <strong>
                        Não foi possível carregar
                        ${escapeHTML(
                            config.title
                        )}.
                    </strong>

                    <p>
                        ${escapeHTML(
                            getErrorMessage(error)
                        )}
                    </p>

                    <button
                        class="btn btn-primary"
                        type="button"
                        data-crud-retry="${escapeHTML(
                            type
                        )}"
                    >
                        Tentar novamente
                    </button>

                </div>
            `;


            container
                .querySelector(
                    "[data-crud-retry]"
                )
                ?.addEventListener(
                    "click",
                    () => loadCrud(type)
                );
        }
    }


    function renderCrud(
        type,
        data
    ) {

        const config =
            CRUD_CONFIG[type];

        const container =
            document.getElementById(
                config.container
            );


        let html = `

            <div
                style="
                    display:flex;
                    justify-content:space-between;
                    align-items:center;
                    gap:15px;
                    margin-bottom:20px;
                    flex-wrap:wrap;
                "
            >

                <div>

                    <strong>
                        ${data.length}
                        ${
                            data.length === 1
                                ? "registro"
                                : "registros"
                        }
                    </strong>

                </div>

                <button
                    type="button"
                    class="btn btn-primary"
                    data-action="new"
                >
                    + ${escapeHTML(
                        config.singular
                    )}
                </button>

            </div>
        `;


        if (!data.length) {

            html += `

                <div class="admin-empty">

                    <div class="admin-empty-icon">
                        ✦
                    </div>

                    <h3>
                        Nenhum ${
                            config.singular.toLowerCase()
                        } cadastrado
                    </h3>

                    <p>
                        Clique no botão acima para
                        criar o primeiro registro.
                    </p>

                </div>
            `;


            container.innerHTML =
                html;


            container
                .querySelector(
                    '[data-action="new"]'
                )
                ?.addEventListener(
                    "click",
                    () => openCrudModal(type)
                );

            return;
        }


        html += `

            <div class="admin-table-wrapper">

                <table class="admin-table">

                    <thead>

                        <tr>

                            <th>
                                Título
                            </th>

                            <th>
                                Categoria
                            </th>

                            <th>
                                Status
                            </th>

                            <th>
                                Data
                            </th>

                            <th>
                                Ações
                            </th>

                        </tr>

                    </thead>

                    <tbody>
        `;


        data.forEach(item => {

            const title =
                item.title ||
                item.name ||
                "Sem título";


            const category =
                item.category ||
                "—";


            const published =
                item.published === true ||
                item.is_published === true ||
                item.status === "published";


            html += `

                <tr>

                    <td>
                        <strong>
                            ${escapeHTML(title)}
                        </strong>
                    </td>

                    <td>
                        ${escapeHTML(category)}
                    </td>

                    <td>

                        <span
                            style="
                                display:inline-block;
                                padding:5px 9px;
                                border-radius:20px;
                                font-size:12px;
                                background:${
                                    published
                                        ? "rgba(53,208,127,.12)"
                                        : "rgba(220,80,80,.12)"
                                };
                            "
                        >
                            ${
                                published
                                    ? "Publicado"
                                    : "Rascunho"
                            }
                        </span>

                    </td>

                    <td>
                        ${formatDate(
                            item.created_at
                        )}
                    </td>

                    <td>

                        <div
                            style="
                                display:flex;
                                gap:7px;
                                flex-wrap:wrap;
                            "
                        >

                            <button
                                type="button"
                                class="btn btn-secondary"
                                data-edit-id="${escapeHTML(
                                    item.id
                                )}"
                            >
                                ✏️ Editar
                            </button>

                            <button
                                type="button"
                                class="btn btn-secondary"
                                data-toggle-id="${escapeHTML(
                                    item.id
                                )}"
                            >
                                ${
                                    published
                                        ? "Despublicar"
                                        : "Publicar"
                                }
                            </button>

                            <button
                                type="button"
                                class="btn btn-secondary"
                                data-delete-id="${escapeHTML(
                                    item.id
                                )}"
                            >
                                🗑️ Excluir
                            </button>

                        </div>

                    </td>

                </tr>
            `;
        });


        html += `

                    </tbody>

                </table>

            </div>
        `;


        container.innerHTML =
            html;


        container
            .querySelector(
                '[data-action="new"]'
            )
            ?.addEventListener(
                "click",
                () => openCrudModal(type)
            );


        container
            .querySelectorAll(
                "[data-edit-id]"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        const item =
                            data.find(
                                row =>
                                    String(row.id) ===
                                    String(
                                        button.dataset.editId
                                    )
                            );

                        if (item) {

                            openCrudModal(
                                type,
                                item
                            );
                        }
                    }
                );
            });


        container
            .querySelectorAll(
                "[data-delete-id]"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        deleteCrudItem(
                            type,
                            button.dataset.deleteId
                        );
                    }
                );
            });


        container
            .querySelectorAll(
                "[data-toggle-id]"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        togglePublished(
                            type,
                            button.dataset.toggleId,
                            data
                        );
                    }
                );
            });
    }


    /*
    ============================================================
    MODAL CRUD
    ============================================================
    */

    function createModal() {

        let modal =
            document.getElementById(
                "crud-modal"
            );


        if (modal) {
            return modal;
        }


        modal =
            document.createElement(
                "div"
            );

        modal.id =
            "crud-modal";

        modal.style.cssText = `
            position:fixed;
            inset:0;
            z-index:99999;
            display:none;
            align-items:center;
            justify-content:center;
            padding:20px;
            background:rgba(0,0,0,.75);
        `;


        modal.innerHTML = `

            <div
                style="
                    width:min(800px,100%);
                    max-height:90vh;
                    overflow:auto;
                    background:#111;
                    border:1px solid rgba(255,255,255,.1);
                    border-radius:18px;
                    padding:25px;
                    box-shadow:0 30px 80px rgba(0,0,0,.5);
                "
            >

                <div
                    style="
                        display:flex;
                        justify-content:space-between;
                        align-items:center;
                        gap:15px;
                        margin-bottom:20px;
                    "
                >

                    <h2
                        id="crud-modal-title"
                        style="margin:0;"
                    >
                        Novo registro
                    </h2>

                    <button
                        type="button"
                        id="crud-modal-close"
                        class="btn btn-secondary"
                    >
                        ×
                    </button>

                </div>

                <form id="crud-form">

                    <div id="crud-form-fields"></div>

                    <div
                        style="
                            display:flex;
                            justify-content:flex-end;
                            gap:10px;
                            margin-top:20px;
                        "
                    >

                        <button
                            type="button"
                            id="crud-cancel"
                            class="btn btn-secondary"
                        >
                            Cancelar
                        </button>

                        <button
                            type="submit"
                            id="crud-save"
                            class="btn btn-primary"
                        >
                            Salvar
                        </button>

                    </div>

                </form>

            </div>
        `;


        document.body.appendChild(
            modal
        );


        modal
            .querySelector(
                "#crud-modal-close"
            )
            .addEventListener(
                "click",
                closeCrudModal
            );


        modal
            .querySelector(
                "#crud-cancel"
            )
            .addEventListener(
                "click",
                closeCrudModal
            );


        modal
            .querySelector(
                "#crud-form"
            )
            .addEventListener(
                "submit",
                saveCrud
            );


        return modal;
    }


    let modalType = null;
    let modalItem = null;


    function openCrudModal(
        type,
        item = null
    ) {

        const config =
            CRUD_CONFIG[type];

        if (!config) {
            return;
        }


        modalType =
            type;

        modalItem =
            item;


        const modal =
            createModal();


        const title =
            modal.querySelector(
                "#crud-modal-title"
            );


        const fields =
            modal.querySelector(
                "#crud-form-fields"
            );


        title.textContent =
            item
                ? `Editar ${config.singular}`
                : `Novo ${config.singular}`;


        fields.innerHTML =
            config.fields
                .map(
                    field =>
                        createField(
                            field,
                            item
                        )
                )
                .join("");


        const titleInput =
            fields.querySelector(
                '[name="title"]'
            );


        const slugInput =
            fields.querySelector(
                '[name="slug"]'
            );


        if (
            titleInput &&
            slugInput &&
            !item
        ) {

            titleInput.addEventListener(
                "input",
                () => {

                    if (
                        !slugInput.dataset.manual
                    ) {

                        slugInput.value =
                            slugify(
                                titleInput.value
                            );
                    }
                }
            );


            slugInput.addEventListener(
                "input",
                () => {

                    slugInput.dataset.manual =
                        "true";
                }
            );
        }


        modal.style.display =
            "flex";


        setTimeout(() => {

            titleInput?.focus();

        }, 50);
    }


    function createField(
        field,
        item
    ) {

        const value =
            item?.[field.name] ??
            "";


        if (
            field.type ===
            "checkbox"
        ) {

            const checked =
                value === true ||
                value === "true" ||
                value === 1;


            return `

                <div
                    class="form-group"
                    style="margin-bottom:18px;"
                >

                    <label
                        style="
                            display:flex;
                            align-items:center;
                            gap:10px;
                            cursor:pointer;
                        "
                    >

                        <input
                            type="checkbox"
                            name="${escapeHTML(
                                field.name
                            )}"
                            ${
                                checked
                                    ? "checked"
                                    : ""
                            }
                        >

                        <span>
                            ${escapeHTML(
                                field.label
                            )}
                        </span>

                    </label>

                </div>
            `;
        }


        if (
            field.type ===
            "textarea"
        ) {

            return `

                <div
                    class="form-group"
                    style="margin-bottom:18px;"
                >

                    <label>
                        ${escapeHTML(
                            field.label
                        )}
                    </label>

                    <textarea
                        name="${escapeHTML(
                            field.name
                        )}"
                        rows="7"
                        ${
                            field.required
                                ? "required"
                                : ""
                        }
                        style="
                            width:100%;
                            resize:vertical;
                        "
                    >${escapeHTML(
                        value
                    )}</textarea>

                </div>
            `;
        }


        if (
            field.type ===
            "image"
        ) {

            return `

                <div
                    class="form-group"
                    style="margin-bottom:18px;"
                >

                    <label>
                        ${escapeHTML(
                            field.label
                        )}
                    </label>

                    <input
                        type="url"
                        name="${escapeHTML(
                            field.name
                        )}"
                        value="${escapeHTML(
                            value
                        )}"
                        placeholder="https://..."
                    >

                    <small>
                        Cole aqui a URL da imagem.
                    </small>

                </div>
            `;
        }


        return `

            <div
                class="form-group"
                style="margin-bottom:18px;"
            >

                <label>
                    ${escapeHTML(
                        field.label
                    )}
                </label>

                <input
                    type="${
                        field.type === "url"
                            ? "url"
                            : "text"
                    }"
                    name="${escapeHTML(
                        field.name
                    )}"
                    value="${escapeHTML(
                        value
                    )}"
                    ${
                        field.required
                            ? "required"
                            : ""
                    }
                >

            </div>
        `;
    }


    function closeCrudModal() {

        const modal =
            document.getElementById(
                "crud-modal"
            );

        if (modal) {

            modal.style.display =
                "none";
        }

        modalType =
            null;

        modalItem =
            null;
    }


    /*
    ============================================================
    SALVAR CRUD
    ============================================================
    */

    async function saveCrud(event) {

        event.preventDefault();


        if (!modalType) {
            return;
        }


        const type =
            modalType;

        const item =
            modalItem;


        const config =
            CRUD_CONFIG[type];


        const form =
            event.target;


        const formData =
            new FormData(form);


        const payload = {};


        config.fields.forEach(field => {

            if (
                field.type ===
                "checkbox"
            ) {

                payload[field.name] =
                    form
                        .querySelector(
                            `[name="${field.name}"]`
                        )
                        .checked;

            } else {

                const value =
                    formData.get(
                        field.name
                    );


                payload[field.name] =
                    value === ""
                        ? null
                        : value;
            }
        });


        const saveButton =
            document.getElementById(
                "crud-save"
            );


        if (saveButton) {

            saveButton.disabled =
                true;

            saveButton.textContent =
                "Salvando...";
        }


        try {

            let result;


            if (item?.id) {

                result =
                    await supabaseClient
                        .from(
                            config.table
                        )
                        .update(
                            payload
                        )
                        .eq(
                            "id",
                            item.id
                        );

            } else {

                result =
                    await supabaseClient
                        .from(
                            config.table
                        )
                        .insert(
                            payload
                        );
            }


            if (result.error) {
                throw result.error;
            }


            closeCrudModal();


            showToast(
                item
                    ? `${config.singular} atualizado com sucesso.`
                    : `${config.singular} criado com sucesso.`
            );


            await loadCrud(type);

            await loadDashboard();

        } catch (error) {

            console.error(
                "Erro salvando registro:",
                error
            );


            alert(
                "Não foi possível salvar.\n\n" +
                getErrorMessage(error)
            );

        } finally {

            if (saveButton) {

                saveButton.disabled =
                    false;

                saveButton.textContent =
                    "Salvar";
            }
        }
    }


    /*
    ============================================================
    EXCLUIR
    ============================================================
    */

    async function deleteCrudItem(
        type,
        id
    ) {

        const config =
            CRUD_CONFIG[type];


        const confirmed =
            confirm(
                `Tem certeza que deseja excluir este ${config.singular.toLowerCase()}?\n\nEssa ação não poderá ser desfeita.`
            );


        if (!confirmed) {
            return;
        }


        try {

            const {
                error
            } =
                await supabaseClient
                    .from(
                        config.table
                    )
                    .delete()
                    .eq(
                        "id",
                        id
                    );


            if (error) {
                throw error;
            }


            showToast(
                `${config.singular} excluído.`
            );


            await loadCrud(type);

            await loadDashboard();

        } catch (error) {

            console.error(
                "Erro excluindo:",
                error
            );


            alert(
                "Não foi possível excluir.\n\n" +
                getErrorMessage(error)
            );
        }
    }


    /*
    ============================================================
    PUBLICAR / DESPUBLICAR
    ============================================================
    */

    async function togglePublished(
        type,
        id,
        data
    ) {

        const config =
            CRUD_CONFIG[type];


        const item =
            data.find(
                row =>
                    String(row.id) ===
                    String(id)
            );


        if (!item) {
            return;
        }


        const current =
            item.published === true ||
            item.is_published === true;


        const newValue =
            !current;


        let column =
            "published";


        if (
            Object.prototype.hasOwnProperty
                .call(
                    item,
                    "is_published"
                )
        ) {

            column =
                "is_published";
        }


        try {

            const {
                error
            } =
                await supabaseClient
                    .from(
                        config.table
                    )
                    .update({
                        [column]:
                            newValue
                    })
                    .eq(
                        "id",
                        id
                    );


            if (error) {
                throw error;
            }


            showToast(
                newValue
                    ? `${config.singular} publicado.`
                    : `${config.singular} despublicado.`
            );


            await loadCrud(type);

        } catch (error) {

            console.error(
                "Erro alterando publicação:",
                error
            );


            alert(
                "Não foi possível alterar o status.\n\n" +
                getErrorMessage(error)
            );
        }
    }


    /*
    ============================================================
    TABELAS SIMPLES
    ============================================================
    */

    async function loadSimpleTable(
        table,
        containerId
    ) {

        const container =
            document.getElementById(
                containerId
            );

        if (!container) {
            return;
        }


        container.innerHTML = `
            <div class="admin-loading">
                Carregando...
            </div>
        `;


        try {

            const {
                data,
                error
            } =
                await supabaseClient
                    .from(table)
                    .select("*")
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

                container.innerHTML = `
                    <div class="admin-empty">
                        <h3>
                            Nenhum registro encontrado
                        </h3>
                    </div>
                `;

                return;
            }


            const columns =
                Object.keys(
                    data[0]
                ).slice(
                    0,
                    8
                );


            let html = `

                <div class="admin-table-wrapper">

                    <table class="admin-table">

                        <thead>

                            <tr>
            `;


            columns.forEach(column => {

                html += `
                    <th>
                        ${escapeHTML(
                            column.replace(
                                /_/g,
                                " "
                            )
                        )}
                    </th>
                `;

            });


            html += `
                            </tr>

                        </thead>

                        <tbody>
            `;


            data.forEach(row => {

                html += "<tr>";


                columns.forEach(column => {

                    let value =
                        row[column];


                    if (
                        value === null ||
                        value === undefined
                    ) {

                        value =
                            "—";
                    }


                    if (
                        typeof value ===
                        "object"
                    ) {

                        value =
                            JSON.stringify(
                                value
                            );
                    }


                    html += `
                        <td>
                            ${escapeHTML(
                                String(
                                    value
                                )
                            )}
                        </td>
                    `;

                });


                html += "</tr>";

            });


            html += `

                        </tbody>

                    </table>

                </div>
            `;


            container.innerHTML =
                html;

        } catch (error) {

            console.error(
                `Erro carregando ${table}:`,
                error
            );

            container.innerHTML = `

                <div class="admin-error">

                    <strong>
                        Erro ao carregar dados.
                    </strong>

                    <p>
                        ${escapeHTML(
                            getErrorMessage(error)
                        )}
                    </p>

                </div>
            `;
        }
    }


    /*
    ============================================================
    CONFIGURAÇÕES
    ============================================================
    */

    async function loadSettings() {

        try {

            const {
                data,
                error
            } =
                await supabaseClient
                    .from("site_settings")
                    .select(
                        "id,site_name,whatsapp,description,service_status"
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

                setServiceStatusError(
                    "Configuração de atendimento não encontrada."
                );

                return;
            }


            const siteName =
                document.getElementById(
                    "setting-site-name"
                );

            const whatsapp =
                document.getElementById(
                    "setting-whatsapp"
                );

            const description =
                document.getElementById(
                    "setting-description"
                );


            if (siteName) {

                siteName.value =
                    data.site_name || "";
            }


            if (whatsapp) {

                whatsapp.value =
                    data.whatsapp || "";
            }


            if (description) {

                description.value =
                    data.description || "";
            }


        } catch (error) {

            console.error(
                "Erro carregando configurações:",
                error
            );
        }
    }


    async function saveSettings(event) {

        event.preventDefault();


        const status =
            document.getElementById(
                "settings-status"
            );


        const payload = {

            site_name:
                document
                    .getElementById(
                        "setting-site-name"
                    )
                    ?.value
                    .trim() || "",

            whatsapp:
                document
                    .getElementById(
                        "setting-whatsapp"
                    )
                    ?.value
                    .trim() || "",

            description:
                document
                    .getElementById(
                        "setting-description"
                    )
                    ?.value
                    .trim() || ""

        };


        try {

            if (status) {

                status.textContent =
                    "Salvando...";
            }


            const {
                data: existing,
                error: selectError
            } =
                await supabaseClient
                    .from("site_settings")
                    .select("id")
                    .eq(
                        "id",
                        1
                    )
                    .maybeSingle();


            if (selectError) {
                throw selectError;
            }


            let result;


            if (existing?.id) {

                result =
                    await supabaseClient
                        .from("site_settings")
                        .update(payload)
                        .eq(
                            "id",
                            1
                        );

            } else {

                result =
                    await supabaseClient
                        .from("site_settings")
                        .insert({
                            id: 1,
                            ...payload
                        });
            }


            if (result.error) {
                throw result.error;
            }


            if (status) {

                status.textContent =
                    "Configurações salvas com sucesso.";
            }


            showToast(
                "Configurações salvas."
            );


        } catch (error) {

            console.error(
                "Erro salvando configurações:",
                error
            );


            if (status) {

                status.textContent =
                    "Erro: " +
                    getErrorMessage(error);
            }
        }
    }


    /*
    ============================================================
    STATUS DO SERVIÇO
    ============================================================
    */

    const SERVICE_STATUS = {

        available: {
            label: "Disponível",
            description:
                "Atendimento disponível.",
            color: "#22c55e"
        },

        busy: {
            label: "Em atendimento",
            description:
                "Estamos atendendo no momento.",
            color: "#eab308"
        },

        offline: {
            label: "Indisponível",
            description:
                "Atendimento indisponível no momento.",
            color: "#ef4444"
        }

    };


    const VALID_SERVICE_STATUSES =
        Object.keys(
            SERVICE_STATUS
        );


    function normalizeServiceStatus(value) {

        const status =
            String(
                value ?? ""
            )
                .toLowerCase()
                .trim();


        if (
            VALID_SERVICE_STATUSES.includes(
                status
            )
        ) {

            return status;
        }


        return null;
    }


    function getServiceStatusLabel(value) {

        const status =
            normalizeServiceStatus(
                value
            );

        if (!status) {
            return "Status indisponível";
        }

        return SERVICE_STATUS[
            status
        ].label;
    }


    /*
    ============================================================
    CONTROLES DO STATUS
    ============================================================
    */

    function setServiceStatusControlsDisabled(
        disabled
    ) {

        const select =
            document.getElementById(
                "service-status-select"
            );

        if (select) {
            select.disabled =
                disabled;
        }


        const toggle =
            document.getElementById(
                "service-status-toggle"
            );

        if (toggle) {
            toggle.disabled =
                disabled;
        }


        document
            .querySelectorAll(
                'input[name="service-status"]'
            )
            .forEach(input => {

                input.disabled =
                    disabled;

            });


        const saveButton =
            document.getElementById(
                "save-service-status"
            );

        if (saveButton) {
            saveButton.disabled =
                disabled;
        }
    }


    /*
    ============================================================
    LOADING DO STATUS
    ============================================================
    */

    function setServiceStatusLoading() {

        serviceStatusLoading =
            true;


        setServiceStatusControlsDisabled(
            true
        );


        const select =
            document.getElementById(
                "service-status-select"
            );


        if (select) {

            select.value =
                "";
        }


        const text =
            document.getElementById(
                "service-status-text"
            );


        if (text) {

            text.textContent =
                "Consultando disponibilidade...";
        }


        const statusLabel =
            document.getElementById(
                "service-status-label"
            );


        if (statusLabel) {

            statusLabel.textContent =
                "Verificando...";
        }


        const statusDescription =
            document.getElementById(
                "service-status-description"
            );


        if (statusDescription) {

            statusDescription.textContent =
                "Consultando o status atual no banco de dados.";
        }


        const dashboard =
            document.getElementById(
                "dashboard-service-status"
            );


        if (dashboard) {

            dashboard.innerHTML = `

                <span
                    style="
                        display:inline-block;
                        width:9px;
                        height:9px;
                        border-radius:50%;
                        background:#94a3b8;
                        margin-right:7px;
                        box-shadow:0 0 10px rgba(148,163,184,.35);
                    "
                ></span>

                <strong>
                    Verificando...
                </strong>
            `;
        }


        setText(
            "dashboard-status-text",
            "Verificando..."
        );


        const statusContainer =
            document.getElementById(
                "service-status-control"
            );


        if (statusContainer) {

            statusContainer.dataset.status =
                "loading";

            statusContainer.classList.remove(
                "status-error",
                "status-available",
                "status-busy",
                "status-offline"
            );

            statusContainer.classList.add(
                "loading"
            );
        }


        /*
        Rádio tradicional, caso exista.
        */

        document
            .querySelectorAll(
                'input[name="service-status"]'
            )
            .forEach(input => {

                input.checked =
                    false;

            });
    }


    /*
    ============================================================
    ERRO DO STATUS
    ============================================================
    */

    function setServiceStatusError(
        message =
            "Não foi possível consultar a disponibilidade agora."
    ) {

        serviceStatusLoading =
            false;


        /*
        IMPORTANTE:

        Não transformamos erro em offline.

        O estado fica indefinido.
        */

        const select =
            document.getElementById(
                "service-status-select"
            );


        if (select) {

            select.value =
                "";

            select.disabled =
                true;
        }


        const toggle =
            document.getElementById(
                "service-status-toggle"
            );


        if (toggle) {

            toggle.checked =
                false;

            toggle.disabled =
                true;
        }


        document
            .querySelectorAll(
                'input[name="service-status"]'
            )
            .forEach(input => {

                input.checked =
                    false;

                input.disabled =
                    true;

            });


        const saveButton =
            document.getElementById(
                "save-service-status"
            );


        if (saveButton) {

            saveButton.disabled =
                true;
        }


        const text =
            document.getElementById(
                "service-status-text"
            );


        if (text) {

            text.textContent =
                message;
        }


        const statusLabel =
            document.getElementById(
                "service-status-label"
            );


        if (statusLabel) {

            statusLabel.textContent =
                "Status indisponível";
        }


        const statusDescription =
            document.getElementById(
                "service-status-description"
            );


        if (statusDescription) {

            statusDescription.textContent =
                message;
        }


        const dashboard =
            document.getElementById(
                "dashboard-service-status"
            );


        if (dashboard) {

            dashboard.innerHTML = `

                <span
                    style="
                        display:inline-block;
                        width:9px;
                        height:9px;
                        border-radius:50%;
                        background:#94a3b8;
                        margin-right:7px;
                        box-shadow:0 0 10px rgba(148,163,184,.35);
                    "
                ></span>

                <strong>
                    Status indisponível
                </strong>
            `;
        }


        setText(
            "dashboard-status-text",
            "Status indisponível"
        );


        const statusContainer =
            document.getElementById(
                "service-status-control"
            );


        if (statusContainer) {

            statusContainer.dataset.status =
                "error";

            statusContainer.classList.remove(
                "status-available",
                "status-busy",
                "status-offline",
                "loading"
            );

            statusContainer.classList.add(
                "status-error"
            );
        }


        return null;
    }


    /*
    ============================================================
    ATUALIZAR UI DO STATUS
    ============================================================
    */

    function updateServiceStatusUI(
        status
    ) {

        const normalized =
            normalizeServiceStatus(
                status
            );


        if (!normalized) {

            return setServiceStatusError(
                "O status de atendimento retornado pelo banco é inválido."
            );
        }


        const config =
            SERVICE_STATUS[
                normalized
            ];


        /*
        Guarda SOMENTE um valor confirmado.
        */

        currentServiceStatus =
            normalized;

        serviceStatusLoading =
            false;


        /*
        Select
        */

        const select =
            document.getElementById(
                "service-status-select"
            );


        if (select) {

            select.value =
                normalized;

            select.disabled =
                false;
        }


        /*
        Toggle antigo
        */

        const toggle =
            document.getElementById(
                "service-status-toggle"
            );


        if (toggle) {

            toggle.checked =
                normalized === "available";

            toggle.disabled =
                false;
        }


        /*
        Rádio tradicional
        */

        document
            .querySelectorAll(
                'input[name="service-status"]'
            )
            .forEach(input => {

                input.checked =
                    input.value ===
                    normalized;

                input.disabled =
                    false;

            });


        /*
        Botão salvar
        */

        const saveButton =
            document.getElementById(
                "save-service-status"
            );


        if (saveButton) {

            saveButton.disabled =
                false;
        }


        /*
        Texto do painel
        */

        const text =
            document.getElementById(
                "service-status-text"
            );


        if (text) {

            text.textContent =
                config.description;
        }


        /*
        Badge dashboard
        */

        const dashboard =
            document.getElementById(
                "dashboard-service-status"
            );


        if (dashboard) {

            dashboard.innerHTML = `

                <span
                    style="
                        display:inline-block;
                        width:9px;
                        height:9px;
                        border-radius:50%;
                        background:${config.color};
                        margin-right:7px;
                        box-shadow:0 0 10px ${config.color};
                    "
                ></span>

                <strong>
                    ${escapeHTML(
                        config.label
                    )}
                </strong>
            `;
        }


        setText(
            "dashboard-status-text",
            config.label
        );


        /*
        Elementos extras
        */

        const statusLabel =
            document.getElementById(
                "service-status-label"
            );


        if (statusLabel) {

            statusLabel.textContent =
                config.label;
        }


        const statusDescription =
            document.getElementById(
                "service-status-description"
            );


        if (statusDescription) {

            statusDescription.textContent =
                config.description;
        }


        /*
        Data attribute e classes
        */

        const statusContainer =
            document.getElementById(
                "service-status-control"
            );


        if (statusContainer) {

            statusContainer.dataset.status =
                normalized;

            statusContainer.classList.remove(
                "status-error",
                "status-available",
                "status-busy",
                "status-offline",
                "loading"
            );

            statusContainer.classList.add(
                `status-${normalized}`
            );
        }


        return normalized;
    }


    /*
    ============================================================
    CARREGAMENTO DO STATUS
    ============================================================
    */

    async function loadServiceStatus() {

        if (serviceStatusLoading) {
            return currentServiceStatus;
        }


        if (!supabaseClient) {

            return setServiceStatusError(
                "Não foi possível conectar ao sistema de atendimento."
            );
        }


        setServiceStatusLoading();


        try {

            const {
                data,
                error
            } =
                await supabaseClient
                    .from("site_settings")
                    .select(
                        "id,service_status"
                    )
                    .eq(
                        "id",
                        1
                    )
                    .maybeSingle();


            if (error) {
                throw error;
            }


            /*
            Registro inexistente não significa offline.
            */

            if (!data) {

                return setServiceStatusError(
                    "Configuração de atendimento não encontrada."
                );
            }


            /*
            O banco precisa retornar um estado válido.
            */

            const normalized =
                normalizeServiceStatus(
                    data.service_status
                );


            if (!normalized) {

                return setServiceStatusError(
                    "O banco retornou um status de atendimento inválido."
                );
            }


            return updateServiceStatusUI(
                normalized
            );

        } catch (error) {

            console.error(
                "Erro carregando status do serviço:",
                error
            );


            return setServiceStatusError(
                "Não foi possível consultar a disponibilidade agora."
            );
        }
    }


    /*
    ============================================================
    ALTERAR STATUS DO SERVIÇO
    ============================================================
    */

    async function changeServiceStatus(
        status
    ) {

        const normalized =
            normalizeServiceStatus(
                status
            );


        if (!normalized) {

            alert(
                "Status de atendimento inválido."
            );

            return false;
        }


        if (!supabaseClient) {

            alert(
                "Sistema de banco de dados indisponível."
            );

            return false;
        }


        const config =
            SERVICE_STATUS[
                normalized
            ];


        /*
        Bloqueia controles enquanto salva.
        */

        setServiceStatusControlsDisabled(
            true
        );


        try {

            const {
                error
            } =
                await supabaseClient
                    .from("site_settings")
                    .update({
                        service_status:
                            normalized,
                        updated_at:
                            new Date().toISOString()
                    })
                    .eq(
                        "id",
                        1
                    );


            if (error) {
                throw error;
            }


            /*
            Confirma novamente no banco antes de
            considerar a operação concluída.
            */

            const {
                data,
                error: verifyError
            } =
                await supabaseClient
                    .from("site_settings")
                    .select(
                        "service_status"
                    )
                    .eq(
                        "id",
                        1
                    )
                    .maybeSingle();


            if (verifyError) {
                throw verifyError;
            }


            const confirmedStatus =
                normalizeServiceStatus(
                    data?.service_status
                );


            if (
                confirmedStatus !==
                normalized
            ) {

                throw new Error(
                    "O banco não confirmou o novo status de atendimento."
                );
            }


            /*
            Somente agora atualizamos a UI.
            */

            updateServiceStatusUI(
                confirmedStatus
            );


            showToast(
                `Status alterado para: ${config.label}.`
            );


            return true;

        } catch (error) {

            console.error(
                "Erro alterando status:",
                error
            );


            /*
            Não fingimos que salvou.

            Tentamos recuperar o último valor real
            do banco.
            */

            await loadServiceStatus();


            alert(
                "Não foi possível alterar o status.\n\n" +
                getErrorMessage(error)
            );


            return false;

        } finally {

            if (
                currentServiceStatus
            ) {

                setServiceStatusControlsDisabled(
                    false
                );
            }
        }
    }


    /*
    ============================================================
    SELECT DE STATUS
    ============================================================
    */

    document
        .getElementById(
            "service-status-select"
        )
        ?.addEventListener(
            "change",
            async event => {

                const value =
                    event.target.value;

                if (!normalizeServiceStatus(value)) {

                    await loadServiceStatus();

                    return;
                }

                await changeServiceStatus(
                    value
                );
            }
        );


    /*
    ============================================================
    RÁDIOS DE STATUS
    ============================================================
    */

    document
        .querySelectorAll(
            'input[name="service-status"]'
        )
        .forEach(input => {

            input.addEventListener(
                "change",
                async event => {

                    if (
                        event.target.checked
                    ) {

                        await changeServiceStatus(
                            event.target.value
                        );
                    }

                }
            );

        });


    /*
    ============================================================
    COMPATIBILIDADE COM TOGGLE ANTIGO
    ============================================================
    */

    document
        .getElementById(
            "service-status-toggle"
        )
        ?.addEventListener(
            "change",
            async event => {

                await changeServiceStatus(
                    event.target.checked
                        ? "available"
                        : "offline"
                );

            }
        );


    /*
    ============================================================
    BOTÃO SALVAR STATUS
    ============================================================
    */

    document
        .getElementById(
            "save-service-status"
        )
        ?.addEventListener(
            "click",
            async () => {

                const select =
                    document.getElementById(
                        "service-status-select"
                    );


                const selected =
                    select?.value ||
                    document.querySelector(
                        'input[name="service-status"]:checked'
                    )?.value;


                if (
                    !normalizeServiceStatus(
                        selected
                    )
                ) {

                    alert(
                        "Selecione um status válido."
                    );

                    return;
                }


                await changeServiceStatus(
                    selected
                );

            }
        );


    /*
    ============================================================
    EVENTOS PRINCIPAIS
    ============================================================
    */

    loginForm?.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const email =
                document
                    .getElementById(
                        "login-email"
                    )
                    ?.value
                    .trim();


            const password =
                document
                    .getElementById(
                        "login-password"
                    )
                    ?.value || "";


            await login(
                email,
                password
            );
        }
    );


    logoutButton?.addEventListener(
        "click",
        logout
    );


    document
        .getElementById(
            "settings-form"
        )
        ?.addEventListener(
            "submit",
            saveSettings
        );


    /*
    ============================================================
    ATUALIZAR DASHBOARD
    ============================================================
    */

    refreshButton?.addEventListener(
        "click",
        async () => {

            refreshButton.disabled =
                true;

            refreshButton.textContent =
                "Atualizando...";


            try {

                await loadDashboard();


                if (
                    CRUD_CONFIG[
                        currentSection
                    ]
                ) {

                    await loadCrud(
                        currentSection
                    );
                }


                if (
                    currentSection ===
                    "library"
                ) {

                    await loadCrud(
                        "articles"
                    );
                }


                if (
                    currentSection ===
                    "leads"
                ) {

                    await loadSimpleTable(
                        "leads",
                        "admin-leads"
                    );
                }


                if (
                    currentSection ===
                    "messages"
                ) {

                    await loadSimpleTable(
                        "messages",
                        "admin-messages"
                    );
                }


                if (
                    currentSection ===
                    "settings"
                ) {

                    await loadSettings();
                }


                if (
                    currentSection ===
                    "service-status"
                ) {

                    await loadServiceStatus();
                }


                showToast(
                    "Painel atualizado."
                );

            } catch (error) {

                console.error(
                    "Erro atualizando painel:",
                    error
                );

                showToast(
                    "Não foi possível atualizar o painel."
                );

            } finally {

                refreshButton.disabled =
                    false;

                refreshButton.textContent =
                    "↻ Atualizar";
            }
        }
    );


    /*
    ============================================================
    MENU MOBILE
    ============================================================
    */

    document
        .getElementById(
            "admin-menu-toggle"
        )
        ?.addEventListener(
            "click",
            () => {

                document
                    .getElementById(
                        "admin-sidebar"
                    )
                    ?.classList.toggle(
                        "open"
                    );

            }
        );


    /*
    ============================================================
    AUTH STATE
    ============================================================
    */

    function watchAuth() {

        if (!supabaseClient) {
            return;
        }


        supabaseClient.auth
            .onAuthStateChange(
                async (
                    event,
                    session
                ) => {

                    if (
                        event ===
                        "SIGNED_IN"
                    ) {

                        currentUser =
                            session?.user ||
                            null;


                        if (currentUser) {

                            await openAdmin();
                        }
                    }


                    if (
                        event ===
                        "SIGNED_OUT"
                    ) {

                        stopServiceStatusPolling();

                        currentUser =
                            null;

                        currentServiceStatus =
                            null;

                        loginScreen.hidden =
                            false;

                        adminApp.hidden =
                            true;
                    }
                }
            );
    }


    /*
    ============================================================
    POLLING DO STATUS
    ============================================================
    */

    function startServiceStatusPolling() {

        stopServiceStatusPolling();


        serviceStatusInterval =
            setInterval(
                async () => {

                    /*
                    Só consulta enquanto:

                    - usuário estiver autenticado;
                    - aba estiver visível;
                    - Supabase estiver disponível.
                    */

                    if (
                        !supabaseClient ||
                        !currentUser ||
                        document.hidden
                    ) {

                        return;
                    }


                    await loadServiceStatus();

                },
                15000
            );
    }


    function stopServiceStatusPolling() {

        if (
            serviceStatusInterval
        ) {

            clearInterval(
                serviceStatusInterval
            );

            serviceStatusInterval =
                null;
        }
    }


    /*
    ============================================================
    ATUALIZA AO VOLTAR PARA A ABA
    ============================================================
    */

    document.addEventListener(
        "visibilitychange",
        () => {

            if (
                !document.hidden &&
                supabaseClient &&
                currentUser
            ) {

                loadServiceStatus();
            }

        }
    );


    /*
    ============================================================
    ESC
    ============================================================
    */

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key ===
                "Escape"
            ) {

                closeCrudModal();
            }

        }
    );


    /*
    ============================================================
    INICIALIZAÇÃO
    ============================================================
    */

    async function init() {

        console.log(
            "Aureon Admin iniciando..."
        );


        if (
            !initializeSupabase()
        ) {

            return;
        }


        /*
        Observa autenticação.
        */

        watchAuth();


        /*
        Verifica sessão existente.
        */

        await checkSession();


        console.log(
            "Aureon Admin pronto."
        );
    }


    /*
    ============================================================
    API GLOBAL
    ============================================================
    */

    window.AureonAdmin = {

        login,

        logout,

        showSection,

        loadDashboard,

        loadCrud,

        openCrudModal,

        closeCrudModal,

        loadSettings,

        saveSettings,

        loadServiceStatus,

        changeServiceStatus,

        updateServiceStatusUI,

        getServiceStatusLabel,

        startServiceStatusPolling,

        stopServiceStatusPolling,

        getCurrentServiceStatus:
            () => currentServiceStatus,

        refresh:
            loadDashboard

    };


    /*
    ============================================================
    START
    ============================================================
    */

    init();

})();