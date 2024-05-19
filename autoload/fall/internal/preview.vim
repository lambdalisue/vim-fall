function! fall#internal#preview#highlight() abort
  let l:eventignore = &eventignore
  try
    let &eventignore = join(split(&eventignore, ',') + ['FileType'], ',')
    silent! filetype detect
    silent! execute printf('runtime syntax/%s.vim', fnameescape(&filetype))
  finally
    let &eventignore = l:eventignore
  endtry
endfunction
