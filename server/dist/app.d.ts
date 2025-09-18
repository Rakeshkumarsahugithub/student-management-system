import { Application } from 'express';
declare class App {
    app: Application;
    constructor();
    private initializeMiddlewares;
    private initializeRoutes;
    private initializeDatabase;
    private initializeErrorHandling;
    private gracefulShutdown;
}
export default App;
//# sourceMappingURL=app.d.ts.map