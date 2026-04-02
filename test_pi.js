const tests = ["pi * r^2", "\\pi * r^2", "api * pi", "pi_1"];
tests.forEach(t => {
  const res = t.replace(/(^|[^\\])\bpi\b/g, '$1\\pi');
  console.log(t, "->", res);
});