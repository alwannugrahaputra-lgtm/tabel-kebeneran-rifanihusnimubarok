import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Check, X, Zap, GitBranch, GitMerge, ArrowRight, ArrowLeftRight, XCircle, Circle } from "lucide-react";

interface LogicOperator {
  symbol: string;
  label: string;
  icon: JSX.Element;
  value: string;
}

const operators: LogicOperator[] = [
  { symbol: "¬", label: "NOT", icon: <XCircle className="w-4 h-4" />, value: "!" },
  { symbol: "∧", label: "AND", icon: <GitMerge className="w-4 h-4" />, value: "&&" },
  { symbol: "∨", label: "OR", icon: <GitBranch className="w-4 h-4" />, value: "||" },
  { symbol: "→", label: "IF THEN", icon: <ArrowRight className="w-4 h-4" />, value: "→" },
  { symbol: "↔", label: "IFF", icon: <ArrowLeftRight className="w-4 h-4" />, value: "↔" },
  { symbol: "⊕", label: "XOR", icon: <Zap className="w-4 h-4" />, value: "⊕" },
  { symbol: "↑", label: "NAND", icon: <Circle className="w-4 h-4" />, value: "↑" },
  { symbol: "↓", label: "NOR", icon: <Circle className="w-4 h-4 fill-current" />, value: "↓" },
];

const TruthTableCalculator = () => {
  const [expression, setExpression] = useState("(A && !B) || C");
  const [results, setResults] = useState<any>(null);

  const insertOperator = (op: string) => {
    setExpression((prev) => prev + op);
  };

  const getVariables = (expr: string): string[] => {
    const vars = expr.match(/[A-Z]/g) || [];
    return Array.from(new Set(vars)).sort();
  };

  const evaluateExpression = (expr: string, values: Record<string, boolean>): boolean => {
    let normalizedExpr = expr;
    
    // Replace logical operators
    normalizedExpr = normalizedExpr.replace(/→/g, "IMPL");
    normalizedExpr = normalizedExpr.replace(/↔/g, "IFF");
    normalizedExpr = normalizedExpr.replace(/⊕/g, "XOR");
    normalizedExpr = normalizedExpr.replace(/↑/g, "NAND");
    normalizedExpr = normalizedExpr.replace(/↓/g, "NOR");
    normalizedExpr = normalizedExpr.replace(/∧/g, "&&");
    normalizedExpr = normalizedExpr.replace(/∨/g, "||");
    normalizedExpr = normalizedExpr.replace(/¬/g, "!");

    // Replace variables
    Object.keys(values).forEach((variable) => {
      const regex = new RegExp(variable, "g");
      normalizedExpr = normalizedExpr.replace(regex, values[variable].toString());
    });

    // Handle special operators
    normalizedExpr = normalizedExpr.replace(/(\w+)\s*IMPL\s*(\w+)/g, "(!$1 || $2)");
    normalizedExpr = normalizedExpr.replace(/(\w+)\s*IFF\s*(\w+)/g, "(($1 && $2) || (!$1 && !$2))");
    normalizedExpr = normalizedExpr.replace(/(\w+)\s*XOR\s*(\w+)/g, "(($1 || $2) && !($1 && $2))");
    normalizedExpr = normalizedExpr.replace(/(\w+)\s*NAND\s*(\w+)/g, "!($1 && $2)");
    normalizedExpr = normalizedExpr.replace(/(\w+)\s*NOR\s*(\w+)/g, "!($1 || $2)");

    try {
      return eval(normalizedExpr);
    } catch {
      return false;
    }
  };

  const generateTruthTable = () => {
    const variables = getVariables(expression);
    if (variables.length === 0) return;

    const rows: any[] = [];
    const numRows = Math.pow(2, variables.length);

    for (let i = 0; i < numRows; i++) {
      const values: Record<string, boolean> = {};
      variables.forEach((variable, index) => {
        values[variable] = Boolean((i >> (variables.length - 1 - index)) & 1);
      });

      const result = evaluateExpression(expression, values);
      rows.push({ ...values, result });
    }

    // Generate CNF and DNF with steps
    const trueRows = rows.filter((row) => row.result);
    const falseRows = rows.filter((row) => !row.result);

    // CNF Steps
    const cnfSteps = falseRows.map((row, idx) => ({
      rowNumber: rows.indexOf(row) + 1,
      values: variables.map(v => ({ var: v, val: row[v] })),
      clause: "(" + variables.map((v) => (row[v] ? `¬${v}` : v)).join(" ∨ ") + ")"
    }));

    const cnf = cnfSteps.length > 0 
      ? cnfSteps.map(s => s.clause).join(" ∧ ")
      : "Tautologi (semua hasil TRUE)";

    // DNF Steps
    const dnfSteps = trueRows.map((row, idx) => ({
      rowNumber: rows.indexOf(row) + 1,
      values: variables.map(v => ({ var: v, val: row[v] })),
      clause: "(" + variables.map((v) => (row[v] ? v : `¬${v}`)).join(" ∧ ") + ")"
    }));

    const dnf = dnfSteps.length > 0
      ? dnfSteps.map(s => s.clause).join(" ∨ ")
      : "Kontradiksi (semua hasil FALSE)";

    setResults({ variables, rows, cnf, dnf, cnfSteps, dnfSteps });
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4 animate-fade-in">
          <h1 className="text-4xl sm:text-5xl font-bold text-primary neon-text">
            Kalkulator Tabel Kebenaran
          </h1>
          <p className="text-muted-foreground text-lg">
            Analisis ekspresi logika dengan CNF & DNF
          </p>
        </div>

        {/* Input Section */}
        <Card className="neon-border bg-card/50 backdrop-blur-sm animate-fade-in">
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-4">
              <Input
                value={expression}
                onChange={(e) => setExpression(e.target.value)}
                placeholder="(A && !B) || C"
                className="text-lg h-14 bg-secondary/50 border-primary/30 focus:border-primary text-foreground"
              />

              {/* Operator Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {operators.map((op) => (
                  <Button
                    key={op.symbol}
                    onClick={() => insertOperator(op.value)}
                    variant="secondary"
                    className="h-20 flex flex-col gap-2 bg-secondary/80 hover:bg-primary/20 hover:border-primary/50 border border-border transition-all duration-300 group"
                  >
                    <div className="text-primary group-hover:scale-110 transition-transform">
                      {op.icon}
                    </div>
                    <div className="text-xs text-muted-foreground">{op.label}</div>
                    <div className="text-2xl font-bold text-foreground">{op.symbol}</div>
                  </Button>
                ))}
              </div>

              <Button
                onClick={generateTruthTable}
                className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-lg"
              >
                Generate Tabel Kebenaran
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results Section */}
        {results && (
          <div className="space-y-6 animate-fade-in">
            <Tabs defaultValue="hasil" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-secondary/50">
                <TabsTrigger value="hasil">Hasil</TabsTrigger>
                <TabsTrigger value="cnf">CNF</TabsTrigger>
                <TabsTrigger value="dnf">DNF</TabsTrigger>
              </TabsList>

              <TabsContent value="hasil" className="mt-6">
                <Card className="neon-border bg-card/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-primary">Tabel Kebenaran</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-border hover:bg-secondary/30">
                            {results.variables.map((variable: string) => (
                              <TableHead
                                key={variable}
                                className="text-center font-bold text-primary"
                              >
                                {variable}
                              </TableHead>
                            ))}
                            <TableHead className="text-center font-bold text-primary">
                              Result
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {results.rows.map((row: any, index: number) => (
                            <TableRow
                              key={index}
                              className="border-border hover:bg-secondary/30 transition-colors"
                            >
                              {results.variables.map((variable: string) => (
                                <TableCell
                                  key={variable}
                                  className="text-center font-semibold"
                                >
                                  {row[variable] ? (
                                    <span className="inline-flex items-center gap-1 text-success">
                                      <Check className="w-4 h-4" /> T
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-destructive">
                                      <X className="w-4 h-4" /> F
                                    </span>
                                  )}
                                </TableCell>
                              ))}
                              <TableCell className="text-center font-bold">
                                {row.result ? (
                                  <span className="inline-flex items-center gap-1 text-success">
                                    <Check className="w-4 h-4" /> T
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-destructive">
                                    <X className="w-4 h-4" /> F
                                  </span>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="cnf" className="mt-6">
                <Card className="neon-border bg-primary/10 backdrop-blur-sm border-primary/30">
                  <CardHeader>
                    <CardTitle className="text-primary flex items-center gap-2">
                      <GitMerge className="w-5 h-5" />
                      Conjunctive Normal Form (CNF)
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-2">
                      Konjungsi (AND) dari disjungsi (OR) - dibentuk dari baris FALSE
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {results.cnfSteps && results.cnfSteps.length > 0 ? (
                      <>
                        <div className="space-y-3">
                          <h4 className="font-semibold text-sm text-primary">Langkah-langkah:</h4>
                          {results.cnfSteps.map((step: any, idx: number) => (
                            <div key={idx} className="bg-secondary/20 p-4 rounded-lg border border-primary/20 hover:border-primary/40 transition-all">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                                  {idx + 1}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  Baris {step.rowNumber} (FALSE)
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-2 mb-2">
                                {step.values.map((v: any, i: number) => (
                                  <span key={i} className="text-xs px-2 py-1 rounded bg-secondary/50">
                                    {v.var} = {v.val ? "T" : "F"}
                                  </span>
                                ))}
                              </div>
                              <p className="font-mono text-foreground bg-secondary/50 p-3 rounded">
                                {step.clause}
                              </p>
                            </div>
                          ))}
                        </div>
                        <div className="pt-4 border-t border-primary/20">
                          <h4 className="font-semibold text-sm text-primary mb-3">Hasil Akhir CNF:</h4>
                          <p className="text-lg font-mono text-foreground bg-secondary/30 p-6 rounded-lg border-2 border-primary/40">
                            {results.cnf}
                          </p>
                        </div>
                      </>
                    ) : (
                      <p className="text-lg font-mono text-foreground bg-secondary/30 p-6 rounded-lg">
                        {results.cnf}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="dnf" className="mt-6">
                <Card className="neon-border bg-primary/10 backdrop-blur-sm border-primary/30">
                  <CardHeader>
                    <CardTitle className="text-primary flex items-center gap-2">
                      <GitBranch className="w-5 h-5" />
                      Disjunctive Normal Form (DNF)
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-2">
                      Disjungsi (OR) dari konjungsi (AND) - dibentuk dari baris TRUE
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {results.dnfSteps && results.dnfSteps.length > 0 ? (
                      <>
                        <div className="space-y-3">
                          <h4 className="font-semibold text-sm text-primary">Langkah-langkah:</h4>
                          {results.dnfSteps.map((step: any, idx: number) => (
                            <div key={idx} className="bg-secondary/20 p-4 rounded-lg border border-primary/20 hover:border-primary/40 transition-all">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="bg-success text-background w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                                  {idx + 1}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  Baris {step.rowNumber} (TRUE)
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-2 mb-2">
                                {step.values.map((v: any, i: number) => (
                                  <span key={i} className="text-xs px-2 py-1 rounded bg-secondary/50">
                                    {v.var} = {v.val ? "T" : "F"}
                                  </span>
                                ))}
                              </div>
                              <p className="font-mono text-foreground bg-secondary/50 p-3 rounded">
                                {step.clause}
                              </p>
                            </div>
                          ))}
                        </div>
                        <div className="pt-4 border-t border-primary/20">
                          <h4 className="font-semibold text-sm text-primary mb-3">Hasil Akhir DNF:</h4>
                          <p className="text-lg font-mono text-foreground bg-secondary/30 p-6 rounded-lg border-2 border-success/40">
                            {results.dnf}
                          </p>
                        </div>
                      </>
                    ) : (
                      <p className="text-lg font-mono text-foreground bg-secondary/30 p-6 rounded-lg">
                        {results.dnf}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Footer */}
        <footer className="text-center text-muted-foreground py-8">
          <p className="text-sm">© Rifani Husni Mubarok 2025</p>
        </footer>
      </div>
    </div>
  );
};

export default TruthTableCalculator;
