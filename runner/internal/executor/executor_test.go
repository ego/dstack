package executor

import (
	"bytes"
	"context"
	"github.com/dstackai/dstack/runner/internal/schemas"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"io"
	"os"
	"path/filepath"
	"testing"
)

// todo should we test context cancellation?

// todo test credentials
// todo test public repo (no credentials)
// todo test local repo (tar)
// todo test get history

func TestExecutor_WorkingDir(t *testing.T) {
	var b bytes.Buffer
	ex := makeTestExecutor(t)
	ex.jobSpec.Commands = []string{"pwd"}

	err := ex.execJob(context.TODO(), io.Writer(&b))
	assert.NoError(t, err)
	assert.Equal(t, ex.workingDir+"\n", b.String())
}

func TestExecutor_HomeDir(t *testing.T) {
	var b bytes.Buffer
	ex := makeTestExecutor(t)
	ex.jobSpec.Commands = []string{"echo ~"}

	err := ex.execJob(context.TODO(), io.Writer(&b))
	assert.NoError(t, err)
	assert.Equal(t, ex.homeDir+"\n", b.String())
}

func TestExecutor_NonZeroExit(t *testing.T) {
	ex := makeTestExecutor(t)
	ex.jobSpec.Commands = []string{"ehco 1"} // intentional misspelling

	err := ex.execJob(context.TODO(), io.Discard)
	assert.Error(t, err)
}

func makeTestExecutor(t *testing.T) *Executor {
	t.Helper()
	baseDir, err := filepath.EvalSymlinks(t.TempDir())
	require.NoError(t, err)

	body := schemas.SubmitBody{
		JobSpec: schemas.JobSpec{
			Commands:    nil, // note: fill before run
			Entrypoint:  []string{"/bin/bash", "-c"},
			Env:         make(map[string]string),
			MaxDuration: 0, // no timeout
			WorkingDir:  ".",
		},
		Secrets: make(map[string]string),
	}

	temp := filepath.Join(baseDir, "temp")
	_ = os.Mkdir(temp, 0700)
	home := filepath.Join(baseDir, "home")
	_ = os.Mkdir(home, 0700)
	repo := filepath.Join(baseDir, "repo")
	_ = os.Mkdir(repo, 0700)
	ex := NewExecutor(temp, home, repo)
	ex.SetJob(body)
	ex.SetCodePath(filepath.Join(baseDir, "code")) // note: create file before run
	return ex
}
